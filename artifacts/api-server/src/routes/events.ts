import { Router } from "express";
import { db, eventsTable, eventRegistrationsTable, usersTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";

const router = Router();

async function formatEvent(event: any, userId?: number | null) {
  const registrations = await db.select().from(eventRegistrationsTable)
    .where(and(eq(eventRegistrationsTable.eventId, event.id), eq(eventRegistrationsTable.status, "confirmed")));

  const currentParticipants = registrations.length;
  const isFull = currentParticipants >= event.maxParticipants;

  let isRegistered = false;
  if (userId) {
    const myReg = registrations.find(r => r.userId === userId);
    isRegistered = !!myReg;
  }

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    imageUrl: event.imageUrl,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    category: event.category,
    price: event.price,
    maxParticipants: event.maxParticipants,
    currentParticipants,
    isFull,
    isFree: event.isFree,
    isRegistered,
  };
}

router.get("/my-registrations", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const registrations = await db.select().from(eventRegistrationsTable).where(eq(eventRegistrationsTable.userId, userId));

  const enriched = await Promise.all(registrations.map(async reg => {
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, reg.eventId)).limit(1);
    return {
      id: reg.id,
      eventId: reg.eventId,
      eventTitle: event?.title ?? "",
      eventDate: event?.date ?? "",
      qrCode: reg.qrCode ?? `QR-${reg.id}`,
      status: reg.status,
      createdAt: reg.createdAt?.toISOString?.() ?? reg.createdAt,
    };
  }));

  res.json(enriched);
});

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  const { category, upcoming } = req.query as Record<string, string>;

  let events = await db.select().from(eventsTable);

  if (category) {
    events = events.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }

  if (upcoming === "true") {
    const today = new Date().toISOString().split("T")[0];
    events = events.filter(e => e.date >= today);
  }

  events.sort((a, b) => a.date.localeCompare(b.date));

  const enriched = await Promise.all(events.map(e => formatEvent(e, userId)));
  res.json(enriched);
});

router.get("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  const id = parseInt(req.params.id);

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id)).limit(1);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  res.json(await formatEvent(event, userId));
});

router.post("/:id/register", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const eventId = parseInt(req.params.id);
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).limit(1);
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const existingReg = await db.select().from(eventRegistrationsTable)
    .where(and(eq(eventRegistrationsTable.eventId, eventId), eq(eventRegistrationsTable.userId, userId)))
    .limit(1);

  if (existingReg[0]) {
    // Reactivate if cancelled
    if (existingReg[0].status === "cancelled") {
      const [updated] = await db.update(eventRegistrationsTable)
        .set({ status: "confirmed" })
        .where(eq(eventRegistrationsTable.id, existingReg[0].id))
        .returning();
      res.json({
        id: updated.id,
        eventId: updated.eventId,
        eventTitle: event.title,
        eventDate: event.date,
        qrCode: updated.qrCode ?? `QR-${updated.id}`,
        status: updated.status,
        createdAt: updated.createdAt?.toISOString?.() ?? updated.createdAt,
      });
      return;
    }
    res.status(409).json({ error: "Already registered" });
    return;
  }

  const [reg] = await db.insert(eventRegistrationsTable).values({
    eventId,
    userId,
    status: "confirmed",
    qrCode: `BK-EVT-${eventId}-${userId}-${Date.now()}`,
  }).returning();

  // Award 30 points for event registration
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user) {
    const newPoints = user.loyaltyPoints + 30;
    const newLevel = computeLoyaltyLevel(newPoints);
    await db.update(usersTable).set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel }).where(eq(usersTable.id, userId));
    await db.insert(loyaltyTransactionsTable).values({
      userId,
      points: 30,
      type: "earned",
      reason: `Partecipazione evento: ${event.title}`,
    });
  }

  res.json({
    id: reg.id,
    eventId: reg.eventId,
    eventTitle: event.title,
    eventDate: event.date,
    qrCode: reg.qrCode ?? `QR-${reg.id}`,
    status: reg.status,
    createdAt: reg.createdAt?.toISOString?.() ?? reg.createdAt,
  });
});

router.post("/:id/cancel", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const eventId = parseInt(req.params.id);
  const [reg] = await db.select().from(eventRegistrationsTable)
    .where(and(eq(eventRegistrationsTable.eventId, eventId), eq(eventRegistrationsTable.userId, userId)))
    .limit(1);

  if (!reg) { res.status(404).json({ error: "Registration not found" }); return; }

  await db.update(eventRegistrationsTable).set({ status: "cancelled" }).where(eq(eventRegistrationsTable.id, reg.id));
  res.json({ message: "Registration cancelled" });
});

export { router as eventsRouter };
