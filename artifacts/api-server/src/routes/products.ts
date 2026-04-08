import { Router } from "express";
import { db, productsTable, productCategoriesTable, reviewsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function enrichProduct(p: any) {
  const reviews = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.targetType, "product"), eq(reviewsTable.targetId, p.id)));

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const [category] = await db.select().from(productCategoriesTable).where(eq(productCategoriesTable.id, p.categoryId)).limit(1);

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl,
    images: p.images ?? [],
    categoryId: p.categoryId,
    categoryName: category?.name ?? "",
    isAvailable: p.isAvailable,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    variants: p.variants ?? [],
    averageRating: avgRating,
    reviewCount: reviews.length,
  };
}

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db.select().from(productCategoriesTable);
  res.json(categories);
});

router.get("/featured", async (_req, res): Promise<void> => {
  const newArrivals = await db.select().from(productsTable).where(eq(productsTable.isNewArrival, true));
  const bestSellers = await db.select().from(productsTable).where(eq(productsTable.isFeatured, true));

  const [enrichedNew, enrichedBest] = await Promise.all([
    Promise.all(newArrivals.map(enrichProduct)),
    Promise.all(bestSellers.map(enrichProduct)),
  ]);

  res.json({ newArrivals: enrichedNew, bestSellers: enrichedBest });
});

router.get("/", async (req, res): Promise<void> => {
  const { category, search, sort } = req.query as Record<string, string>;

  let products = await db.select().from(productsTable);

  if (category) {
    const cat = await db.select().from(productCategoriesTable).where(eq(productCategoriesTable.slug, category)).limit(1);
    if (cat[0]) {
      products = products.filter(p => p.categoryId === cat[0].id);
    }
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  if (sort === "price_asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") products.sort((a, b) => b.price - a.price);

  const enriched = await Promise.all(products.map(enrichProduct));
  res.json(enriched);
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(await enrichProduct(product));
});

export { router as productsRouter };
