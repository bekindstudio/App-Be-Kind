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

async function formatOrder(order: any) {
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
}

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const formatted = await Promise.all(orders.map(formatOrder));
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

  // Clear cart
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  // Award loyalty points
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

  res.status(201).json(await formatOrder(order));
});

router.get("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const orderId = parseInt(req.params.id);
  const [order] = await db.select().from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  if (!order || order.userId !== userId) { res.status(404).json({ error: "Order not found" }); return; }

  // Simulate status progression for demo
  const createdAt = new Date(order.createdAt).getTime();
  const elapsed = (Date.now() - createdAt) / 1000 / 60; // minutes
  let status = order.status;
  if (order.status === "received" && elapsed > 2) status = "preparing";
  if (order.status !== "delivered" && order.status !== "cancelled" && elapsed > 5) status = "preparing";
  if (elapsed > 10) status = "ready";
  if (order.type === "delivery" && elapsed > 15) status = "delivering";
  if (elapsed > 30) status = "delivered";

  if (status !== order.status) {
    await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, orderId));
  }

  res.json(await formatOrder({ ...order, status }));
});

router.post("/:id/reorder", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const orderId = parseInt(req.params.id);
  const [originalOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!originalOrder || originalOrder.userId !== userId) { res.status(404).json({ error: "Order not found" }); return; }

  const originalItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  // Clear current cart and add original items
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

  // Create a new order immediately
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

  // Award points
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

  res.json(await formatOrder(newOrder));
});

export { router as ordersRouter };
