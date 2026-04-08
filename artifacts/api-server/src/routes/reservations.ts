import { Router } from "express";
import { db, reservationsTable, usersTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";
import { CreateReservationBody, UpdateReservationBody } from "@workspace/api-zod";

const router = Router();

const LUNCH_SLOTS = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
const DINNER_SLOTS = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"];
const ALL_SLOTS = [...LUNCH_SLOTS, ...DINNER_SLOTS];

function formatReservation(r: any) {
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    guests: r.guests,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  };
}

router.get("/availability", async (req, res): Promise<void> => {
  const { date } = req.query as { date: string; guests: string };

  if (!date) { res.status(400).json({ error: "date required" }); return; }

  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 1) { // Monday = closed
    res.json({ date, availableSlots: [], closedDay: true });
    return;
  }

  // Find reserved slots
  const reservedSlots = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.date, date), eq(reservationsTable.status, "confirmed")));

  const availableSlots = ALL_SLOTS.filter(slot =>
    reservedSlots.filter(r => r.time === slot).length < 4
  );

  res.json({ date, availableSlots, closedDay: false });
});

router.get("/my-registrations", async (req, res): Promise<void> => {
  // This is for events, handled in events router
  res.json([]);
});

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const reservations = await db.select().from(reservationsTable).where(eq(reservationsTable.userId, userId));
  res.json(reservations.map(formatReservation));
});

router.post("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { date, time, guests, notes } = parsed.data;

  const [reservation] = await db.insert(reservationsTable).values({
    userId,
    date,
    time,
    guests,
    notes: notes ?? null,
    status: "confirmed",
  }).returning();

  // Award 20 points for reservation
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user) {
    const newPoints = user.loyaltyPoints + 20;
    const newLevel = computeLoyaltyLevel(newPoints);
    await db.update(usersTable).set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel }).where(eq(usersTable.id, userId));
    await db.insert(loyaltyTransactionsTable).values({
      userId,
      points: 20,
      type: "earned",
      reason: `Prenotazione tavolo - ${date}`,
    });
  }

  res.status(201).json(formatReservation(reservation));
});

router.get("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id);
  const [reservation] = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.id, id), eq(reservationsTable.userId, userId)))
    .limit(1);

  if (!reservation) { res.status(404).json({ error: "Reservation not found" }); return; }
  res.json(formatReservation(reservation));
});

router.put("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id);
  const parsed = UpdateReservationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.id, id), eq(reservationsTable.userId, userId)))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Reservation not found" }); return; }

  const [updated] = await db.update(reservationsTable)
    .set({ ...parsed.data })
    .where(eq(reservationsTable.id, id))
    .returning();

  res.json(formatReservation(updated));
});

router.delete("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.id, id), eq(reservationsTable.userId, userId)))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Reservation not found" }); return; }

  await db.update(reservationsTable).set({ status: "cancelled" }).where(eq(reservationsTable.id, id));
  res.json({ message: "Reservation cancelled" });
});

export { router as reservationsRouter };
