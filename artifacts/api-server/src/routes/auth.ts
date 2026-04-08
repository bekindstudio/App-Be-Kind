import { Router } from "express";
import { db, usersTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import {
  RegisterBody,
  LoginBody,
} from "@workspace/api-zod";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "bekind-salt").digest("hex");
}

function makeToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}:bekind-jwt-secret`).toString("base64");
}

function parseToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId] = decoded.split(":");
    return parseInt(userId, 10);
  } catch {
    return null;
  }
}

function computeLoyaltyLevel(points: number): string {
  if (points >= 5000) return "Platinum";
  if (points >= 2000) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
}

export function getUserIdFromRequest(req: any): number | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return parseToken(token);
}

function formatUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    dateOfBirth: user.dateOfBirth,
    loyaltyPoints: user.loyaltyPoints,
    loyaltyLevel: user.loyaltyLevel,
    createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
  };
}

router.post("/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { firstName, lastName, email, password, phone, dateOfBirth } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    firstName,
    lastName,
    email,
    phone,
    passwordHash: hashPassword(password),
    dateOfBirth: dateOfBirth ?? null,
    acceptedTerms: true,
    loyaltyPoints: 50,
    loyaltyLevel: "Bronze",
  }).returning();

  await db.insert(loyaltyTransactionsTable).values({
    userId: user.id,
    points: 50,
    type: "earned",
    reason: "Bonus benvenuto - primo accesso",
  });

  const token = makeToken(user.id);
  res.status(201).json({ token, user: formatUser(user) });
});

router.post("/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.passwordHash || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = makeToken(user.id);
  res.json({ token, user: formatUser(user) });
});

router.post("/google", async (req, res): Promise<void> => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ error: "Missing Google credential" });
    return;
  }

  try {
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!verifyRes.ok) {
      res.status(401).json({ error: "Invalid Google token" });
      return;
    }
    const googleUser = await verifyRes.json() as any;
    const { sub: googleId, email, given_name, family_name, picture } = googleUser;

    if (!email) {
      res.status(400).json({ error: "Google account has no email" });
      return;
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId)).limit(1);

    if (!user) {
      [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (user) {
        await db.update(usersTable).set({ googleId, avatarUrl: picture || user.avatarUrl }).where(eq(usersTable.id, user.id));
        user = { ...user, googleId, avatarUrl: picture || user.avatarUrl };
      }
    }

    if (!user) {
      [user] = await db.insert(usersTable).values({
        email,
        googleId,
        firstName: given_name || "Utente",
        lastName: family_name || "",
        phone: "",
        avatarUrl: picture || null,
        acceptedTerms: true,
        loyaltyPoints: 50,
        loyaltyLevel: "Bronze",
      }).returning();

      await db.insert(loyaltyTransactionsTable).values({
        userId: user.id,
        points: 50,
        type: "earned",
        reason: "Bonus benvenuto - primo accesso con Google",
      });
    }

    const token = makeToken(user.id);
    res.json({ token, user: formatUser(user) });
  } catch (err: any) {
    console.error("[Google Auth] Error:", err.message);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

router.post("/logout", async (_req, res): Promise<void> => {
  res.json({ message: "Logged out" });
});

router.get("/me", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

export { router as authRouter, computeLoyaltyLevel };
