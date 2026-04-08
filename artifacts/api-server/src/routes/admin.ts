import { Router } from "express";
import { db, usersTable, dishesTable, menuCategoriesTable, eventsTable, productsTable, productCategoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserIdFromRequest } from "./auth";

const router = Router();

async function requireAdmin(req: any, res: any): Promise<number | null> {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Non autorizzato" }); return null; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || !user.isAdmin) { res.status(403).json({ error: "Accesso negato" }); return null; }
  return userId;
}

router.get("/check", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.json({ isAdmin: false }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ isAdmin: user?.isAdmin ?? false });
});

router.get("/dishes", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const dishes = await db.select().from(dishesTable);
  const categories = await db.select().from(menuCategoriesTable);
  const catMap: Record<number, string> = {};
  for (const c of categories) catMap[c.id] = c.name;
  res.json(dishes.map(d => ({ ...d, categoryName: catMap[d.categoryId] || "" })));
});

router.post("/dishes", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const { name, description, price, imageUrl, categoryId, ingredients, allergens, dietaryTags, isAvailable, isFeatured, nutritionInfo } = req.body;
  if (!name || !description || price == null || !categoryId) {
    res.status(400).json({ error: "Campi obbligatori mancanti" }); return;
  }
  const [dish] = await db.insert(dishesTable).values({
    name, description, price: Number(price), imageUrl: imageUrl || null,
    categoryId: Number(categoryId), ingredients: ingredients || [], allergens: allergens || [],
    dietaryTags: dietaryTags || [], isAvailable: isAvailable ?? true, isFeatured: isFeatured ?? false,
    nutritionInfo: nutritionInfo || null,
  }).returning();
  res.json(dish);
});

router.put("/dishes/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const { name, description, price, imageUrl, categoryId, ingredients, allergens, dietaryTags, isAvailable, isFeatured, nutritionInfo } = req.body;
  const [dish] = await db.update(dishesTable).set({
    name, description, price: Number(price), imageUrl: imageUrl || null,
    categoryId: Number(categoryId), ingredients: ingredients || [], allergens: allergens || [],
    dietaryTags: dietaryTags || [], isAvailable: isAvailable ?? true, isFeatured: isFeatured ?? false,
    nutritionInfo: nutritionInfo || null,
  }).where(eq(dishesTable.id, id)).returning();
  if (!dish) { res.status(404).json({ error: "Piatto non trovato" }); return; }
  res.json(dish);
});

router.delete("/dishes/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  await db.delete(dishesTable).where(eq(dishesTable.id, id));
  res.json({ success: true });
});

router.get("/menu-categories", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const categories = await db.select().from(menuCategoriesTable).orderBy(menuCategoriesTable.sortOrder);
  res.json(categories);
});

router.get("/events", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const events = await db.select().from(eventsTable);
  events.sort((a, b) => b.date.localeCompare(a.date));
  res.json(events);
});

router.post("/events", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const { title, description, imageUrl, date, startTime, endTime, location, category, price, maxParticipants, isFree } = req.body;
  if (!title || !description || !date || !startTime || !endTime || !location || !category || !maxParticipants) {
    res.status(400).json({ error: "Campi obbligatori mancanti" }); return;
  }
  const [event] = await db.insert(eventsTable).values({
    title, description, imageUrl: imageUrl || null, date, startTime, endTime, location, category,
    price: Number(price) || 0, maxParticipants: Number(maxParticipants), isFree: isFree ?? false,
  }).returning();
  res.json(event);
});

router.put("/events/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const { title, description, imageUrl, date, startTime, endTime, location, category, price, maxParticipants, isFree } = req.body;
  const [event] = await db.update(eventsTable).set({
    title, description, imageUrl: imageUrl || null, date, startTime, endTime, location, category,
    price: Number(price) || 0, maxParticipants: Number(maxParticipants), isFree: isFree ?? false,
  }).where(eq(eventsTable.id, id)).returning();
  if (!event) { res.status(404).json({ error: "Evento non trovato" }); return; }
  res.json(event);
});

router.delete("/events/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.json({ success: true });
});

router.get("/products", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const products = await db.select().from(productsTable);
  const categories = await db.select().from(productCategoriesTable);
  const catMap: Record<number, string> = {};
  for (const c of categories) catMap[c.id] = c.name;
  res.json(products.map(p => ({ ...p, categoryName: catMap[p.categoryId] || "" })));
});

router.post("/products", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const { name, description, price, imageUrl, images, categoryId, isAvailable, isFeatured, isNewArrival, variants } = req.body;
  if (!name || !description || price == null || !categoryId) {
    res.status(400).json({ error: "Campi obbligatori mancanti" }); return;
  }
  const [product] = await db.insert(productsTable).values({
    name, description, price: Number(price), imageUrl: imageUrl || null, images: images || [],
    categoryId: Number(categoryId), isAvailable: isAvailable ?? true, isFeatured: isFeatured ?? false,
    isNewArrival: isNewArrival ?? false, variants: variants || [],
  }).returning();
  res.json(product);
});

router.put("/products/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const { name, description, price, imageUrl, images, categoryId, isAvailable, isFeatured, isNewArrival, variants } = req.body;
  const [product] = await db.update(productsTable).set({
    name, description, price: Number(price), imageUrl: imageUrl || null, images: images || [],
    categoryId: Number(categoryId), isAvailable: isAvailable ?? true, isFeatured: isFeatured ?? false,
    isNewArrival: isNewArrival ?? false, variants: variants || [],
  }).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Prodotto non trovato" }); return; }
  res.json(product);
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true });
});

router.get("/product-categories", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const categories = await db.select().from(productCategoriesTable);
  res.json(categories);
});

export { router as adminRouter };
