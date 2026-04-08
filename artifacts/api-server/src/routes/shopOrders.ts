import { Router } from "express";
import { db, shopOrdersTable, shopOrderItemsTable, shopCartItemsTable, usersTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";
import { CreateShopOrderBody } from "@workspace/api-zod";
import { notifyAdmins } from "../lib/admin-notify";

const router = Router();

const SHIPPING_COST = 5.90;
const FREE_SHIPPING_THRESHOLD = 50;

function generateOrderNumber(): string {
  return `BKS${Date.now().toString().slice(-8)}`;
}

async function formatShopOrder(order: any) {
  const items = await db.select().from(shopOrderItemsTable).where(eq(shopOrderItemsTable.shopOrderId, order.id));
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    items: items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
      selectedVariants: i.selectedVariants,
    })),
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    total: order.total,
    shippingAddress: order.shippingAddress,
    trackingNumber: order.trackingNumber,
    pointsEarned: order.pointsEarned,
    createdAt: order.createdAt?.toISOString?.() ?? order.createdAt,
  };
}

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const orders = await db.select().from(shopOrdersTable)
    .where(eq(shopOrdersTable.userId, userId))
    .orderBy(desc(shopOrdersTable.createdAt));

  const formatted = await Promise.all(orders.map(formatShopOrder));
  res.json(formatted);
});

router.post("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateShopOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { shippingAddress } = parsed.data;

  const cartItems = await db.select().from(shopCartItemsTable).where(eq(shopCartItemsTable.userId, userId));
  if (cartItems.length === 0) { res.status(400).json({ error: "Shop cart is empty" }); return; }

  const subtotal = cartItems.reduce((sum, i) => sum + (i.productPrice * i.quantity), 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;
  const pointsEarned = Math.floor(total);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  const [order] = await db.insert(shopOrdersTable).values({
    userId,
    orderNumber: generateOrderNumber(),
    status: "confirmed",
    subtotal,
    shippingCost,
    total,
    shippingAddress,
    trackingNumber: `TRK${Date.now().toString().slice(-10)}`,
    codiceFiscale: user?.codiceFiscale || null,
    billingName: user ? `${user.firstName} ${user.lastName}` : null,
    billingAddress: shippingAddress,
    paymentMethod: "cash",
    pointsEarned,
  }).returning();

  await Promise.all(cartItems.map(item =>
    db.insert(shopOrderItemsTable).values({
      shopOrderId: order.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.productPrice,
      subtotal: item.productPrice * item.quantity,
      selectedVariants: item.selectedVariants,
    })
  ));

  await db.delete(shopCartItemsTable).where(eq(shopCartItemsTable.userId, userId));
  if (user) {
    const newPoints = user.loyaltyPoints + pointsEarned;
    const newLevel = computeLoyaltyLevel(newPoints);
    await db.update(usersTable).set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel }).where(eq(usersTable.id, userId));
    await db.insert(loyaltyTransactionsTable).values({
      userId,
      points: pointsEarned,
      type: "earned",
      reason: `Acquisto shop #${order.orderNumber}`,
    });
  }

  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Cliente";
  notifyAdmins(
    `Nuovo ordine Bottega #${order.orderNumber}`,
    `${userName} ha ordinato ${cartItems.length} prodott${cartItems.length === 1 ? "o" : "i"} per €${total.toFixed(2)} — Spedizione: ${shippingAddress}`,
    "order"
  ).catch(err => console.error("Admin notify error:", err));

  res.status(201).json(await formatShopOrder(order));
});

router.get("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id);
  const [order] = await db.select().from(shopOrdersTable)
    .where(eq(shopOrdersTable.id, id))
    .limit(1);

  if (!order || order.userId !== userId) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(await formatShopOrder(order));
});

export { router as shopOrdersRouter };
