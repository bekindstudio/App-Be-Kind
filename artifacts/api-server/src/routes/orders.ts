import { Router } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, usersTable, dishesTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";
import { CreateOrderBody } from "@workspace/api-zod";

const router = Router();

const DELIVERY_COST = 2.50;
const FREE_DELIVERY_THRESHOLD = 25;

function generateOrderNumber(): string {
  return `BK${Date.now().toString().slice(-8)}`;
}

const RIDER_NAMES = ["Marco R.", "Luca B.", "Alessio F.", "Davide M.", "Simone G."];
const RIDER_VEHICLES = ["scooter", "bici", "auto"];

function getSimulatedRider(orderId: number) {
  const idx = orderId % RIDER_NAMES.length;
  return {
    name: RIDER_NAMES[idx],
    phone: `+39 333 ${String(1000000 + (orderId * 7919) % 9000000).slice(0, 7)}`,
    vehicle: RIDER_VEHICLES[orderId % RIDER_VEHICLES.length] as "scooter" | "bici" | "auto",
  };
}

function getDeliveryTracking(order: any) {
  if (order.type !== "delivery") return null;

  const createdAt = new Date(order.createdAt).getTime();
  const elapsedMin = (Date.now() - createdAt) / 1000 / 60;
  const estimatedMin = order.estimatedDeliveryTime || 40;

  const rider = getSimulatedRider(order.id);

  let riderStatus: "assigned" | "picking_up" | "on_the_way" | "nearby" | "arrived" = "assigned";
  let progress = 0;
  let etaMinutes = estimatedMin;

  if (order.status === "delivering") {
    const deliveryStartMin = 15;
    const deliveryElapsed = Math.max(0, elapsedMin - deliveryStartMin);
    const deliveryDuration = estimatedMin - deliveryStartMin;
    progress = Math.min(100, (deliveryElapsed / deliveryDuration) * 100);

    if (progress < 10) {
      riderStatus = "picking_up";
    } else if (progress < 75) {
      riderStatus = "on_the_way";
    } else if (progress < 95) {
      riderStatus = "nearby";
    } else {
      riderStatus = "arrived";
    }

    etaMinutes = Math.max(1, Math.round(estimatedMin - elapsedMin));
  } else if (order.status === "delivered") {
    progress = 100;
    riderStatus = "arrived";
    etaMinutes = 0;
  } else if (order.status === "ready") {
    riderStatus = "assigned";
    progress = 0;
    etaMinutes = Math.max(1, Math.round(estimatedMin - elapsedMin));
  } else {
    return null;
  }

  const restaurantLat = 43.9612;
  const restaurantLng = 12.7382;
  const deliveryLat = restaurantLat + 0.012;
  const deliveryLng = restaurantLng + 0.008;
  const p = progress / 100;
  const riderLat = restaurantLat + (deliveryLat - restaurantLat) * p;
  const riderLng = restaurantLng + (deliveryLng - restaurantLng) * p;

  return {
    rider,
    riderStatus,
    progress: Math.round(progress),
    etaMinutes,
    riderPosition: { lat: riderLat, lng: riderLng },
    restaurantPosition: { lat: restaurantLat, lng: restaurantLng },
    deliveryPosition: { lat: deliveryLat, lng: deliveryLng },
  };
}

async function formatOrder(order: any, includeTracking = false) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const result: any = {
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

  if (includeTracking) {
    result.tracking = getDeliveryTracking(order);
  }

  return result;
}

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const formatted = await Promise.all(orders.map(o => formatOrder(o)));
  res.json(formatted);
});

router.post("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { type, deliveryAddress, pickupTime, notes } = parsed.data;

  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  if (cartItems.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

  const subtotal = cartItems.reduce((sum, i) => sum + (i.dishPrice * i.quantity), 0);
  const deliveryCost = type === "delivery" ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_COST) : 0;
  const total = subtotal + deliveryCost;
  const pointsEarned = Math.floor(total);

  const [order] = await db.insert(ordersTable).values({
    userId,
    orderNumber: generateOrderNumber(),
    type,
    status: "received",
    subtotal,
    deliveryCost,
    total,
    deliveryAddress: deliveryAddress ?? null,
    pickupTime: pickupTime ?? null,
    estimatedDeliveryTime: type === "delivery" ? 40 : 25,
    notes: notes ?? null,
    pointsEarned,
  }).returning();

  await Promise.all(cartItems.map(item =>
    db.insert(orderItemsTable).values({
      orderId: order.id,
      dishId: item.dishId,
      dishName: item.dishName,
      quantity: item.quantity,
      unitPrice: item.dishPrice,
      subtotal: item.dishPrice * item.quantity,
      customizations: item.customizations,
    })
  ));

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user) {
    const newPoints = user.loyaltyPoints + pointsEarned;
    const newLevel = computeLoyaltyLevel(newPoints);
    await db.update(usersTable).set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel }).where(eq(usersTable.id, userId));
    await db.insert(loyaltyTransactionsTable).values({
      userId,
      points: pointsEarned,
      type: "earned",
      reason: `Ordine #${order.orderNumber}`,
    });
  }

  res.status(201).json(await formatOrder(order, true));
});

router.get("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const orderId = parseInt(req.params.id);
  const [order] = await db.select().from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  if (!order || order.userId !== userId) { res.status(404).json({ error: "Order not found" }); return; }

  const createdAt = new Date(order.createdAt).getTime();
  const elapsed = (Date.now() - createdAt) / 1000 / 60;
  let status = order.status;
  if (order.status === "received" && elapsed > 2) status = "preparing";
  if (order.status !== "delivered" && order.status !== "cancelled" && elapsed > 5) status = "preparing";
  if (elapsed > 10) status = "ready";
  if (order.type === "delivery" && elapsed > 15) status = "delivering";
  if (elapsed > 30) status = "delivered";

  if (status !== order.status) {
    await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, orderId));
  }

  res.json(await formatOrder({ ...order, status }, true));
});

router.post("/:id/reorder", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const orderId = parseInt(req.params.id);
  const [originalOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!originalOrder || originalOrder.userId !== userId) { res.status(404).json({ error: "Order not found" }); return; }

  const originalItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  for (const item of originalItems) {
    await db.insert(cartItemsTable).values({
      userId,
      dishId: item.dishId,
      dishName: item.dishName,
      dishPrice: item.unitPrice,
      quantity: item.quantity,
      customizations: item.customizations,
    });
  }

  const subtotal = originalItems.reduce((sum, i) => sum + i.subtotal, 0);
  const deliveryCost = originalOrder.type === "delivery" ? (subtotal >= 25 ? 0 : 2.5) : 0;
  const total = subtotal + deliveryCost;
  const pointsEarned = Math.floor(total);

  const [newOrder] = await db.insert(ordersTable).values({
    userId,
    orderNumber: generateOrderNumber(),
    type: originalOrder.type,
    status: "received",
    subtotal,
    deliveryCost,
    total,
    deliveryAddress: originalOrder.deliveryAddress,
    estimatedDeliveryTime: originalOrder.type === "delivery" ? 40 : 25,
    pointsEarned,
  }).returning();

  for (const item of originalItems) {
    await db.insert(orderItemsTable).values({
      orderId: newOrder.id,
      dishId: item.dishId,
      dishName: item.dishName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      customizations: item.customizations,
    });
  }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user) {
    const newPoints = user.loyaltyPoints + pointsEarned;
    const newLevel = computeLoyaltyLevel(newPoints);
    await db.update(usersTable).set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel }).where(eq(usersTable.id, userId));
    await db.insert(loyaltyTransactionsTable).values({
      userId,
      points: pointsEarned,
      type: "earned",
      reason: `Riordine #${newOrder.orderNumber}`,
    });
  }

  res.json(await formatOrder(newOrder, true));
});

export { router as ordersRouter };
