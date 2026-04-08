import { Router } from "express";
import { db, cartItemsTable, dishesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getUserIdFromRequest } from "./auth";
import { AddToCartBody, UpdateCartItemBody } from "@workspace/api-zod";

const router = Router();

const DELIVERY_COST = 2.50;
const FREE_DELIVERY_THRESHOLD = 25;

async function getCartResponse(userId: number, orderType?: string | null) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  const cartItems = items.map(item => ({
    id: item.id,
    dishId: item.dishId,
    dishName: item.dishName,
    dishPrice: item.dishPrice,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    customizations: item.customizations,
    subtotal: item.dishPrice * item.quantity,
  }));

  const subtotal = cartItems.reduce((sum, i) => sum + i.subtotal, 0);
  const deliveryCost = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_COST;
  const total = subtotal + deliveryCost;

  return {
    items: cartItems,
    subtotal,
    deliveryCost,
    total,
    orderType: orderType ?? null,
  };
}

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json(await getCartResponse(userId));
});

router.delete("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  res.json({ message: "Cart cleared" });
});

router.post("/items", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { dishId, quantity, customizations } = parsed.data;

  const [dish] = await db.select().from(dishesTable).where(eq(dishesTable.id, dishId)).limit(1);
  if (!dish) { res.status(404).json({ error: "Dish not found" }); return; }

  const existing = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.dishId, dishId)))
    .limit(1);

  if (existing[0]) {
    await db.update(cartItemsTable)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItemsTable.id, existing[0].id));
  } else {
    await db.insert(cartItemsTable).values({
      userId,
      dishId,
      dishName: dish.name,
      dishPrice: dish.price,
      imageUrl: dish.imageUrl,
      quantity,
      customizations: customizations ?? null,
    });
  }

  res.json(await getCartResponse(userId));
});

router.put("/items/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const itemId = parseInt(req.params.id);
  const [item] = await db.select().from(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, userId))).limit(1);
  if (!item) { res.status(404).json({ error: "Cart item not found" }); return; }

  if (parsed.data.quantity <= 0) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  } else {
    await db.update(cartItemsTable).set({ quantity: parsed.data.quantity }).where(eq(cartItemsTable.id, itemId));
  }

  res.json(await getCartResponse(userId));
});

router.delete("/items/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const itemId = parseInt(req.params.id);
  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, userId)));

  res.json(await getCartResponse(userId));
});

export { router as cartRouter };
