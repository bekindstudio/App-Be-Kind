import { Router } from "express";
import { db, reviewsTable, usersTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";
import { CreateReviewBody } from "@workspace/api-zod";

const router = Router();

router.post("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { rating, text, targetType, targetId } = parsed.data;

  const [review] = await db.insert(reviewsTable).values({
    userId,
    rating,
    text: text ?? null,
    targetType,
    targetId,
  }).returning();

  // Award points for review
  const pointsMap: Record<string, number> = {
    dish: 10,
    order: 15,
    event: 15,
  };
  const points = pointsMap[targetType] ?? 10;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user) {
    const newPoints = user.loyaltyPoints + points;
    const newLevel = computeLoyaltyLevel(newPoints);
    await db.update(usersTable).set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel }).where(eq(usersTable.id, userId));
    await db.insert(loyaltyTransactionsTable).values({
      userId,
      points,
      type: "earned",
      reason: `Recensione ${targetType}`,
    });
  }

  res.status(201).json({
    id: review.id,
    userId: review.userId,
    userName: user ? `${user.firstName} ${user.lastName}` : "Utente",
    rating: review.rating,
    text: review.text,
    targetType: review.targetType,
    targetId: review.targetId,
    createdAt: review.createdAt?.toISOString?.() ?? review.createdAt,
  });
});

router.get("/:targetType/:targetId", async (req, res): Promise<void> => {
  const { targetType, targetId } = req.params;
  const id = parseInt(targetId);

  const reviews = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.targetType, targetType), eq(reviewsTable.targetId, id)))
    .orderBy(desc(reviewsTable.createdAt));

  const enriched = await Promise.all(reviews.map(async r => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
    return {
      id: r.id,
      userId: r.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : "Utente",
      rating: r.rating,
      text: r.text,
      targetType: r.targetType,
      targetId: r.targetId,
      createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    };
  }));

  res.json(enriched);
});

export { router as reviewsRouter };
