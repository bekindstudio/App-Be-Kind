import { Router } from "express";
import { db, usersTable, loyaltyTransactionsTable, userStampsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";
import { RedeemPointsBody } from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();

const LEVEL_THRESHOLDS = {
  Bronze: { min: 0, max: 499 },
  Silver: { min: 500, max: 1999 },
  Gold: { min: 2000, max: 4999 },
  Platinum: { min: 5000, max: Infinity },
};

function getLoyaltyInfo(points: number) {
  const level = computeLoyaltyLevel(points) as keyof typeof LEVEL_THRESHOLDS;
  const levelNames = ["Bronze", "Silver", "Gold", "Platinum"];
  const currentIndex = levelNames.indexOf(level);
  const nextLevel = currentIndex < levelNames.length - 1 ? levelNames[currentIndex + 1] : null;

  let pointsToNextLevel: number | null = null;
  let progressPercent = 100;

  if (nextLevel) {
    const currentThreshold = LEVEL_THRESHOLDS[level];
    const nextThreshold = LEVEL_THRESHOLDS[nextLevel as keyof typeof LEVEL_THRESHOLDS];
    const range = nextThreshold.min - currentThreshold.min;
    const progress = points - currentThreshold.min;
    progressPercent = Math.min(100, Math.round((progress / range) * 100));
    pointsToNextLevel = nextThreshold.min - points;
  }

  return { level, nextLevel, pointsToNextLevel, progressPercent };
}

function generateQrToken(): string {
  return "BK-" + crypto.randomBytes(12).toString("hex").toUpperCase();
}

router.get("/balance", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const info = getLoyaltyInfo(user.loyaltyPoints);

  res.json({
    points: user.loyaltyPoints,
    ...info,
  });
});

router.get("/history", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const history = await db.select().from(loyaltyTransactionsTable)
    .where(eq(loyaltyTransactionsTable.userId, userId))
    .orderBy(desc(loyaltyTransactionsTable.createdAt));

  res.json(history.map(t => ({
    id: t.id,
    points: t.points,
    type: t.type,
    reason: t.reason,
    createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
  })));
});

router.get("/stamps", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const stamps = await db.select().from(userStampsTable)
    .where(eq(userStampsTable.userId, userId))
    .orderBy(desc(userStampsTable.createdAt));

  res.json(stamps.map(s => ({
    id: s.id,
    stampId: s.stampId,
    awardedBy: s.awardedBy,
    createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
  })));
});

router.get("/qr-data", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  let qrToken = user.qrToken;
  if (!qrToken) {
    qrToken = generateQrToken();
    await db.update(usersTable).set({ qrToken }).where(eq(usersTable.id, userId));
  }

  res.json({ qrToken });
});

router.post("/redeem", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = RedeemPointsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { points } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (user.loyaltyPoints < points) {
    res.status(400).json({ error: "Insufficient points" });
    return;
  }

  const newPoints = user.loyaltyPoints - points;
  const newLevel = computeLoyaltyLevel(newPoints);
  await db.update(usersTable).set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel }).where(eq(usersTable.id, userId));

  await db.insert(loyaltyTransactionsTable).values({
    userId,
    points,
    type: "redeemed",
    reason: `Riscatto ${points} punti`,
  });

  res.json({ message: `Hai riscattato ${points} punti con successo` });
});

export { router as loyaltyRouter };
