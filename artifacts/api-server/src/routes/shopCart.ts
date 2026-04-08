import { Router } from "express";
import { db, shopCartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getUserIdFromRequest } from "./auth";
import { AddToShopCartBody, UpdateShopCartItemBody } from "@workspace/api-zod";

const router = Router();

const SHIPPING_COST = 5.90;
const FREE_SHIPPING_THRESHOLD = 50;

async function getShopCartResponse(userId: number) {
  const items = await db.select().from(shopCartItemsTable).where(eq(shopCartItemsTable.userId, userId));

  const cartItems = items.map(item => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productPrice: item.productPrice,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    selectedVariants: item.selectedVariants,
    subtotal: item.productPrice * item.quantity,
  }));

  const subtotal = cartItems.reduce((sum, i) => sum + i.subtotal, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;

  return { items: cartItems, subtotal, shippingCost, total };
}

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json(await getShopCartResponse(userId));
});

router.delete("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(shopCartItemsTable).where(eq(shopCartItemsTable.userId, userId));
  res.json({ message: "Shop cart cleared" });
});

router.post("/items", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = AddToShopCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { productId, quantity, selectedVariants } = parsed.data;
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const existing = await db.select().from(shopCartItemsTable)
    .where(and(eq(shopCartItemsTable.userId, userId), eq(shopCartItemsTable.productId, productId)))
    .limit(1);

  if (existing[0]) {
    await db.update(shopCartItemsTable)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(shopCartItemsTable.id, existing[0].id));
  } else {
    await db.insert(shopCartItemsTable).values({
      userId,
      productId,
      productName: product.name,
      productPrice: product.price,
      imageUrl: product.imageUrl,
      quantity,
      selectedVariants: selectedVariants ?? null,
    });
  }

  res.json(await getShopCartResponse(userId));
});

router.put("/items/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = UpdateShopCartItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const itemId = parseInt(req.params.id);
  const [item] = await db.select().from(shopCartItemsTable)
    .where(and(eq(shopCartItemsTable.id, itemId), eq(shopCartItemsTable.userId, userId)))
    .limit(1);

  if (!item) { res.status(404).json({ error: "Item not found" }); return; }

  if (parsed.data.quantity <= 0) {
    await db.delete(shopCartItemsTable).where(eq(shopCartItemsTable.id, itemId));
  } else {
    await db.update(shopCartItemsTable).set({ quantity: parsed.data.quantity }).where(eq(shopCartItemsTable.id, itemId));
  }

  res.json(await getShopCartResponse(userId));
});

router.delete("/items/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const itemId = parseInt(req.params.id);
  await db.delete(shopCartItemsTable).where(and(eq(shopCartItemsTable.id, itemId), eq(shopCartItemsTable.userId, userId)));

  res.json(await getShopCartResponse(userId));
});

export { router as shopCartRouter };
