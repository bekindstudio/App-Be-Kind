import { Router } from "express";
import { db, usersTable, dishesTable, menuCategoriesTable, eventsTable, eventRegistrationsTable, productsTable, productCategoriesTable, ordersTable, orderItemsTable, shopOrdersTable, shopOrderItemsTable, reservationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
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

router.get("/stats", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const [dishCount] = await db.select({ count: sql<number>`count(*)` }).from(dishesTable);
  const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(eventsTable);
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(productsTable);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable);
  const [shopOrderCount] = await db.select({ count: sql<number>`count(*)` }).from(shopOrdersTable);
  const [reservationCount] = await db.select({ count: sql<number>`count(*)` }).from(reservationsTable);
  const [registrationCount] = await db.select({ count: sql<number>`count(*)` }).from(eventRegistrationsTable);

  const pendingOrders = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(
    sql`${ordersTable.status} IN ('received', 'preparing')`
  );
  const pendingShopOrders = await db.select({ count: sql<number>`count(*)` }).from(shopOrdersTable).where(
    sql`${shopOrdersTable.status} IN ('pending', 'confirmed')`
  );

  const today = new Date().toISOString().split("T")[0];
  const [todayReservations] = await db.select({ count: sql<number>`count(*)` }).from(reservationsTable).where(
    sql`${reservationsTable.date} = ${today} AND ${reservationsTable.status} != 'cancelled'`
  );

  res.json({
    dishes: Number(dishCount.count),
    events: Number(eventCount.count),
    products: Number(productCount.count),
    users: Number(userCount.count),
    orders: Number(orderCount.count),
    shopOrders: Number(shopOrderCount.count),
    reservations: Number(reservationCount.count),
    eventRegistrations: Number(registrationCount.count),
    pendingOrders: Number(pendingOrders[0].count),
    pendingShopOrders: Number(pendingShopOrders[0].count),
    todayReservations: Number(todayReservations.count),
  });
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

router.post("/menu-categories", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const { name, slug, icon, sortOrder } = req.body;
  if (!name || !slug) { res.status(400).json({ error: "Nome e slug obbligatori" }); return; }
  const [cat] = await db.insert(menuCategoriesTable).values({
    name, slug, icon: icon || "🍽️", sortOrder: sortOrder || 99,
  }).returning();
  res.json(cat);
});

router.put("/menu-categories/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const { name, slug, icon, sortOrder } = req.body;
  const [cat] = await db.update(menuCategoriesTable).set({
    name, slug, icon: icon || "🍽️", sortOrder: sortOrder || 99,
  }).where(eq(menuCategoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Categoria non trovata" }); return; }
  res.json(cat);
});

router.delete("/menu-categories/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const dishes = await db.select({ count: sql<number>`count(*)` }).from(dishesTable).where(eq(dishesTable.categoryId, id));
  if (Number(dishes[0].count) > 0) {
    res.status(400).json({ error: "Impossibile eliminare: ci sono piatti in questa categoria" }); return;
  }
  await db.delete(menuCategoriesTable).where(eq(menuCategoriesTable.id, id));
  res.json({ success: true });
});

router.get("/events", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const events = await db.select().from(eventsTable);
  events.sort((a, b) => b.date.localeCompare(a.date));

  const enriched = await Promise.all(events.map(async (event) => {
    const regs = await db.select({ count: sql<number>`count(*)` }).from(eventRegistrationsTable)
      .where(sql`${eventRegistrationsTable.eventId} = ${event.id} AND ${eventRegistrationsTable.status} = 'confirmed'`);
    return { ...event, currentParticipants: Number(regs[0].count) };
  }));

  res.json(enriched);
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
  await db.delete(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, id));
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

router.post("/product-categories", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const { name, slug, icon } = req.body;
  if (!name || !slug) { res.status(400).json({ error: "Nome e slug obbligatori" }); return; }
  const [cat] = await db.insert(productCategoriesTable).values({
    name, slug, icon: icon || "📦",
  }).returning();
  res.json(cat);
});

router.put("/product-categories/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const { name, slug, icon } = req.body;
  const [cat] = await db.update(productCategoriesTable).set({
    name, slug, icon: icon || "📦",
  }).where(eq(productCategoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Categoria non trovata" }); return; }
  res.json(cat);
});

router.delete("/product-categories/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const products = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.categoryId, id));
  if (Number(products[0].count) > 0) {
    res.status(400).json({ error: "Impossibile eliminare: ci sono prodotti in questa categoria" }); return;
  }
  await db.delete(productCategoriesTable).where(eq(productCategoriesTable.id, id));
  res.json({ success: true });
});

router.get("/orders", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const enriched = await Promise.all(orders.map(async (order) => {
    const [user] = await db.select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, order.userId)).limit(1);
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    return {
      ...order,
      customerEmail: user?.email ?? "",
      customerName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
      items,
      createdAt: order.createdAt?.toISOString?.() ?? order.createdAt,
    };
  }));
  res.json(enriched);
});

router.put("/orders/:id/status", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "Stato obbligatorio" }); return; }
  const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Ordine non trovato" }); return; }
  res.json(order);
});

router.get("/shop-orders", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const orders = await db.select().from(shopOrdersTable).orderBy(desc(shopOrdersTable.createdAt));
  const enriched = await Promise.all(orders.map(async (order) => {
    const [user] = await db.select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, order.userId)).limit(1);
    const items = await db.select().from(shopOrderItemsTable).where(eq(shopOrderItemsTable.shopOrderId, order.id));
    return {
      ...order,
      customerEmail: user?.email ?? "",
      customerName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
      items,
      createdAt: order.createdAt?.toISOString?.() ?? order.createdAt,
    };
  }));
  res.json(enriched);
});

router.put("/shop-orders/:id/status", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const { status, trackingNumber } = req.body;
  if (!status) { res.status(400).json({ error: "Stato obbligatorio" }); return; }
  const updateData: any = { status };
  if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
  const [order] = await db.update(shopOrdersTable).set(updateData).where(eq(shopOrdersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Ordine non trovato" }); return; }
  res.json(order);
});

router.get("/reservations", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const reservations = await db.select().from(reservationsTable).orderBy(desc(reservationsTable.createdAt));
  const enriched = await Promise.all(reservations.map(async (r) => {
    const [user] = await db.select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName, phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
    return {
      ...r,
      customerEmail: user?.email ?? "",
      customerName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
      customerPhone: user?.phone ?? "",
      createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    };
  }));
  res.json(enriched);
});

router.put("/reservations/:id/status", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "Stato obbligatorio" }); return; }
  const [reservation] = await db.update(reservationsTable).set({ status }).where(eq(reservationsTable.id, id)).returning();
  if (!reservation) { res.status(404).json({ error: "Prenotazione non trovata" }); return; }
  res.json(reservation);
});

router.get("/users", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    phone: usersTable.phone,
    isAdmin: usersTable.isAdmin,
    loyaltyPoints: usersTable.loyaltyPoints,
    loyaltyLevel: usersTable.loyaltyLevel,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(u => ({ ...u, name: `${u.firstName} ${u.lastName}`.trim(), createdAt: u.createdAt?.toISOString?.() ?? u.createdAt })));
});

router.put("/users/:id/admin", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  const { isAdmin } = req.body;
  const [user] = await db.update(usersTable).set({ isAdmin: !!isAdmin }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Utente non trovato" }); return; }
  res.json({ id: user.id, isAdmin: user.isAdmin });
});

export { router as adminRouter };
