import { Router } from "express";
import { db, menuCategoriesTable, dishesTable, reviewsTable, usersTable } from "@workspace/db";
import { eq, ilike, and, or } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

async function enrichDish(dish: any) {
  const reviews = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.targetType, "dish"), eq(reviewsTable.targetId, dish.id)));

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const category = await db.select().from(menuCategoriesTable).where(eq(menuCategoriesTable.id, dish.categoryId)).limit(1);

  return {
    id: dish.id,
    name: dish.name,
    description: dish.description,
    price: dish.price,
    imageUrl: dish.imageUrl,
    categoryId: dish.categoryId,
    categoryName: category[0]?.name ?? "",
    ingredients: dish.ingredients ?? [],
    allergens: dish.allergens ?? [],
    dietaryTags: dish.dietaryTags ?? [],
    isAvailable: dish.isAvailable,
    isFeatured: dish.isFeatured,
    averageRating: avgRating,
    reviewCount: reviews.length,
    nutritionInfo: dish.nutritionInfo ? JSON.parse(dish.nutritionInfo) : null,
  };
}

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db.select().from(menuCategoriesTable).orderBy(menuCategoriesTable.sortOrder);
  res.json(categories);
});

router.get("/dishes", async (req, res): Promise<void> => {
  const { category, search, dietary, allergen } = req.query as Record<string, string>;

  let dishes = await db.select().from(dishesTable);

  if (category) {
    const cat = await db.select().from(menuCategoriesTable).where(eq(menuCategoriesTable.slug, category)).limit(1);
    if (cat[0]) {
      dishes = dishes.filter(d => d.categoryId === cat[0].id);
    }
  }

  if (search) {
    const q = search.toLowerCase();
    dishes = dishes.filter(d =>
      d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
    );
  }

  if (dietary) {
    dishes = dishes.filter(d => d.dietaryTags.includes(dietary));
  }

  if (allergen) {
    dishes = dishes.filter(d => !d.allergens.includes(allergen));
  }

  const enriched = await Promise.all(dishes.map(enrichDish));
  res.json(enriched);
});

router.get("/dishes/featured", async (_req, res): Promise<void> => {
  const dishes = await db.select().from(dishesTable).where(eq(dishesTable.isFeatured, true));
  const enriched = await Promise.all(dishes.map(enrichDish));
  res.json(enriched);
});

router.get("/dishes/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [dish] = await db.select().from(dishesTable).where(eq(dishesTable.id, id)).limit(1);
  if (!dish) {
    res.status(404).json({ error: "Dish not found" });
    return;
  }
  res.json(await enrichDish(dish));
});

export { router as menuRouter };
