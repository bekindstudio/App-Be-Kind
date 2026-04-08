import { Router } from "express";
import { db, usersTable, reservationsTable, ordersTable, orderItemsTable, eventRegistrationsTable, eventsTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";
import { UpdateProfileBody } from "@workspace/api-zod";

const router = Router();

// In-memory address store (simplified - production would use a DB table)
const userAddresses: Record<number, Array<{id: number; label: string; street: string; city: string; postalCode: string; isDefault: boolean}>> = {};
let addressIdCounter = 1;

function getLoyaltyInfo(points: number) {
  function getLevel(p: number) {
    if (p >= 5000) return "Platinum";
    if (p >= 2000) return "Gold";
    if (p >= 500) return "Silver";
    return "Bronze";
  }
  const level = getLevel(points);
  const levelNames = ["Bronze", "Silver", "Gold", "Platinum"];
  const nextLevels: Record<string, number> = { Bronze: 500, Silver: 2000, Gold: 5000 };
  const currentIndex = levelNames.indexOf(level);
  const nextLevel = currentIndex < levelNames.length - 1 ? levelNames[currentIndex + 1] : null;
  const nextThreshold = nextLevel ? nextLevels[level] : null;
  const prevThreshold = level === "Bronze" ? 0 : level === "Silver" ? 500 : level === "Gold" ? 2000 : 5000;
  const range = nextThreshold ? nextThreshold - prevThreshold : 1;
  const progress = nextThreshold ? Math.min(100, Math.round(((points - prevThreshold) / range) * 100)) : 100;
  return {
    points,
    level,
    nextLevel,
    pointsToNextLevel: nextThreshold ? nextThreshold - points : null,
    progressPercent: progress,
  };
}

router.get("/dashboard", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const recentOrders = await db.select().from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt))
    .limit(3);

  const ordersWithItems = await Promise.all(recentOrders.map(async order => {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      items: items.map(i => ({
        id: i.id,
        dishId: i.dishId,
        dishName: i.dishName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
        customizations: i.customizations,
      })),
      subtotal: order.subtotal,
      deliveryCost: order.deliveryCost,
      total: order.total,
      deliveryAddress: order.deliveryAddress,
      pickupTime: order.pickupTime,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      notes: order.notes,
      discountCode: order.discountCode,
      pointsEarned: order.pointsEarned,
      createdAt: order.createdAt?.toISOString?.() ?? order.createdAt,
    };
  }));

  const today = new Date().toISOString().split("T")[0];
  const upcomingReservations = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.userId, userId), eq(reservationsTable.status, "confirmed")))
    .limit(3);
  const futureReservations = upcomingReservations.filter(r => r.date >= today);

  const eventRegs = await db.select().from(eventRegistrationsTable)
    .where(and(eq(eventRegistrationsTable.userId, userId), eq(eventRegistrationsTable.status, "confirmed")))
    .limit(3);

  const upcomingEvents = await Promise.all(eventRegs.map(async reg => {
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, reg.eventId)).limit(1);
    return {
      id: reg.id,
      eventId: reg.eventId,
      eventTitle: event?.title ?? "",
      eventDate: event?.date ?? "",
      qrCode: reg.qrCode ?? `QR-${reg.id}`,
      status: reg.status,
      createdAt: reg.createdAt?.toISOString?.() ?? reg.createdAt,
    };
  }));

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      dateOfBirth: user.dateOfBirth,
      loyaltyPoints: user.loyaltyPoints,
      loyaltyLevel: user.loyaltyLevel,
      createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
    },
    loyaltyBalance: getLoyaltyInfo(user.loyaltyPoints),
    recentOrders: ordersWithItems,
    upcomingReservations: futureReservations.map(r => ({
      id: r.id,
      date: r.date,
      time: r.time,
      guests: r.guests,
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    })),
    upcomingEvents,
  });
});

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    dateOfBirth: user.dateOfBirth,
    dietaryPreferences: user.dietaryPreferences ?? [],
    allergyPreferences: user.allergyPreferences ?? [],
    notificationPreferences: {
      orders: user.notificationOrders,
      promos: user.notificationPromos,
      events: user.notificationEvents,
      loyalty: user.notificationLoyalty,
    },
  });
});

router.put("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { firstName, lastName, phone, dateOfBirth, dietaryPreferences, allergyPreferences, notificationPreferences } = parsed.data;

  const updates: Record<string, any> = {};
  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (phone) updates.phone = phone;
  if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
  if (dietaryPreferences) updates.dietaryPreferences = dietaryPreferences;
  if (allergyPreferences) updates.allergyPreferences = allergyPreferences;
  if (notificationPreferences) {
    if ('orders' in notificationPreferences) updates.notificationOrders = notificationPreferences.orders;
    if ('promos' in notificationPreferences) updates.notificationPromos = notificationPreferences.promos;
    if ('events' in notificationPreferences) updates.notificationEvents = notificationPreferences.events;
    if ('loyalty' in notificationPreferences) updates.notificationLoyalty = notificationPreferences.loyalty;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();

  res.json({
    id: updated.id,
    email: updated.email,
    firstName: updated.firstName,
    lastName: updated.lastName,
    phone: updated.phone,
    avatarUrl: updated.avatarUrl,
    dateOfBirth: updated.dateOfBirth,
    dietaryPreferences: updated.dietaryPreferences ?? [],
    allergyPreferences: updated.allergyPreferences ?? [],
    notificationPreferences: {
      orders: updated.notificationOrders,
      promos: updated.notificationPromos,
      events: updated.notificationEvents,
      loyalty: updated.notificationLoyalty,
    },
  });
});

router.get("/addresses", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  res.json(userAddresses[userId] ?? []);
});

router.post("/addresses", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { label, street, city, postalCode, isDefault } = req.body;

  if (!userAddresses[userId]) userAddresses[userId] = [];

  if (isDefault) {
    userAddresses[userId].forEach(a => { a.isDefault = false; });
  }

  const newAddress = { id: addressIdCounter++, label, street, city, postalCode, isDefault: !!isDefault };
  userAddresses[userId].push(newAddress);

  res.status(201).json(newAddress);
});

router.put("/addresses/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const addressId = parseInt(req.params.id);
  if (!userAddresses[userId]) { res.status(404).json({ error: "Address not found" }); return; }

  const idx = userAddresses[userId].findIndex(a => a.id === addressId);
  if (idx === -1) { res.status(404).json({ error: "Address not found" }); return; }

  const { label, street, city, postalCode, isDefault } = req.body;

  if (isDefault) {
    userAddresses[userId].forEach(a => { a.isDefault = false; });
  }

  userAddresses[userId][idx] = { ...userAddresses[userId][idx], label, street, city, postalCode, isDefault: !!isDefault };
  res.json(userAddresses[userId][idx]);
});

router.delete("/addresses/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const addressId = parseInt(req.params.id);
  if (!userAddresses[userId]) { res.status(404).json({ error: "Address not found" }); return; }

  userAddresses[userId] = userAddresses[userId].filter(a => a.id !== addressId);
  res.json({ message: "Address deleted" });
});

export { router as profileRouter };
