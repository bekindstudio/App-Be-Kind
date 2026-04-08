import { Router } from "express";
import { db, reservationsTable, usersTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";
import { CreateReservationBody, UpdateReservationBody } from "@workspace/api-zod";
import { notifyAdmins } from "../lib/admin-notify";
import {
  getReservationLocationId,
  getTimeSlots,
  createHeldReservation,
  reserveReservation,
  listReservations,
  cancelReservation,
  listReservationLocations,
  getSiteId,
  getCattolicaLocation,
} from "../wix-bookings";

const router = Router();

const WIX_ENABLED = !!(process.env.WIX_API_KEY && process.env.WIX_ACCOUNT_ID);

const BREAKFAST_BRUNCH_SLOTS = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const LUNCH_SLOTS = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
const DINNER_SLOTS = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"];
const ALL_SLOTS = [...BREAKFAST_BRUNCH_SLOTS, ...LUNCH_SLOTS, ...DINNER_SLOTS];
const MAX_COVERS_PER_SLOT = 40;

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

function formatWixReservation(r: any) {
  const details = r.details || {};
  const startDate = details.startDate ? new Date(details.startDate) : null;
  const statusMap: Record<string, string> = {
    HELD: "pending",
    REQUESTED: "pending",
    RESERVED: "confirmed",
    SEATED: "confirmed",
    FINISHED: "completed",
    CANCELED: "cancelled",
    DECLINED: "cancelled",
    NO_SHOW: "cancelled",
    PAYMENT_PENDING: "pending",
  };
  return {
    id: r.id,
    date: startDate ? startDate.toISOString().split("T")[0] : "",
    time: startDate
      ? `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`
      : "",
    guests: details.partySize || 1,
    status: statusMap[r.status] || r.status?.toLowerCase() || "pending",
    notes: r.additionalInfo || "",
    createdAt: r.createdDate || new Date().toISOString(),
    wixReservationId: r.id,
    wixStatus: r.status,
  };
}

router.get("/availability", async (req, res): Promise<void> => {
  const { date, guests } = req.query as { date: string; guests: string };
  if (!date) {
    res.status(400).json({ error: "date required" });
    return;
  }

  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 1) {
    res.json({ date, availableSlots: [], closedDay: true });
    return;
  }

  if (WIX_ENABLED) {
    try {
      const locationId = await getReservationLocationId();
      if (locationId) {
        const partySize = parseInt(guests) || 2;
        const result = await getTimeSlots(locationId, date, partySize);
        const timeSlots = result?.timeSlots || [];

        const wixSlots = timeSlots
          .filter((ts: any) => ts.status === "AVAILABLE")
          .map((ts: any) => {
            const start = new Date(ts.startDate);
            return `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
          });

        res.json({ date, availableSlots: wixSlots, closedDay: false, source: "wix" });
        return;
      }
    } catch (err: any) {
      console.error("[Wix] Time slots query failed, falling back to local:", err.message);
    }
  }

  const reservedSlots = await db
    .select()
    .from(reservationsTable)
    .where(and(eq(reservationsTable.date, date), eq(reservationsTable.status, "confirmed")));

  const availableSlots = ALL_SLOTS.filter(
    (slot) => {
      const bookedGuests = reservedSlots
        .filter((r) => r.time === slot)
        .reduce((sum, r) => sum + (r.guests || 1), 0);
      return bookedGuests < MAX_COVERS_PER_SLOT;
    }
  );

  res.json({ date, availableSlots, closedDay: false, source: "local" });
});

router.get("/my-registrations", async (_req, res): Promise<void> => {
  res.json([]);
});

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (WIX_ENABLED) {
    try {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (user?.email) {
        const result = await listReservations({
          "reservee.email": { $eq: user.email },
        });
        const reservations = (result?.reservations || []).map(formatWixReservation);
        res.json(reservations);
        return;
      }
    } catch (err: any) {
      console.error("[Wix] List reservations failed, falling back to local:", err.message);
    }
  }

  const reservations = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.userId, userId));
  res.json(reservations.map(formatReservation));
});

router.post("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { date, time, guests, notes } = parsed.data;

  if (WIX_ENABLED) {
    try {
      const locationId = await getReservationLocationId();
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (locationId && user) {
        const [hours, minutes] = time.split(":").map(Number);
        const startDate = new Date(`${date}T00:00:00.000Z`);
        startDate.setUTCHours(hours, minutes, 0, 0);

        const heldResult = await createHeldReservation(
          locationId,
          startDate.toISOString(),
          guests
        );
        const heldReservation = heldResult?.reservation;

        if (heldReservation) {
            const reserveResult = await reserveReservation(
            heldReservation.id,
            heldReservation.revision || "1",
            {
              firstName: user.firstName || "Ospite",
              lastName: user.lastName || "",
              email: user.email,
              phone: user.phone || undefined,
            },
            notes || undefined
          );

          const finalReservation = reserveResult?.reservation || heldReservation;

          const [localReservation] = await db
            .insert(reservationsTable)
            .values({
              userId,
              date,
              time,
              guests,
              notes: notes ?? null,
              status: "confirmed",
            })
            .returning();

          const newPoints = user.loyaltyPoints + 20;
          const newLevel = computeLoyaltyLevel(newPoints);
          await db
            .update(usersTable)
            .set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel })
            .where(eq(usersTable.id, userId));
          await db.insert(loyaltyTransactionsTable).values({
            userId,
            points: 20,
            type: "earned",
            reason: `Prenotazione tavolo - ${date}`,
          });

          const wixUserName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
          notifyAdmins(
            `Nuova prenotazione tavolo`,
            `${wixUserName} ha prenotato per ${guests} persone il ${date} alle ${time}${notes ? ` — Note: ${notes}` : ""}`,
            "reservation"
          ).catch(err => console.error("Admin notify error:", err));

          res.status(201).json({
            ...formatReservation(localReservation),
            wixReservationId: finalReservation.id,
            wixStatus: finalReservation.status,
          });
          return;
        }
      }
    } catch (err: any) {
      console.error("[Wix] Create reservation failed, falling back to local:", err.message);
    }
  }

  const [reservation] = await db
    .insert(reservationsTable)
    .values({
      userId,
      date,
      time,
      guests,
      notes: notes ?? null,
      status: "confirmed",
    })
    .returning();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (user) {
    const newPoints = user.loyaltyPoints + 20;
    const newLevel = computeLoyaltyLevel(newPoints);
    await db
      .update(usersTable)
      .set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel })
      .where(eq(usersTable.id, userId));
    await db.insert(loyaltyTransactionsTable).values({
      userId,
      points: 20,
      type: "earned",
      reason: `Prenotazione tavolo - ${date}`,
    });
  }

  const resUser = user;
  if (resUser) {
    const localUserName = `${resUser.firstName || ""} ${resUser.lastName || ""}`.trim() || resUser.email;
    notifyAdmins(
      `Nuova prenotazione tavolo`,
      `${localUserName} ha prenotato per ${guests} persone il ${date} alle ${time}${notes ? ` — Note: ${notes}` : ""}`,
      "reservation"
    ).catch(err => console.error("Admin notify error:", err));
  }

  res.status(201).json(formatReservation(reservation));
});

router.get("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);
  const [reservation] = await db
    .select()
    .from(reservationsTable)
    .where(and(eq(reservationsTable.id, id), eq(reservationsTable.userId, userId)))
    .limit(1);

  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }
  res.json(formatReservation(reservation));
});

router.put("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);
  const parsed = UpdateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(reservationsTable)
    .where(and(eq(reservationsTable.id, id), eq(reservationsTable.userId, userId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const [updated] = await db
    .update(reservationsTable)
    .set({ ...parsed.data })
    .where(eq(reservationsTable.id, id))
    .returning();

  res.json(formatReservation(updated));
});

router.delete("/:id", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);
  const [existing] = await db
    .select()
    .from(reservationsTable)
    .where(and(eq(reservationsTable.id, id), eq(reservationsTable.userId, userId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  await db
    .update(reservationsTable)
    .set({ status: "cancelled" })
    .where(eq(reservationsTable.id, id));
  res.json({ message: "Reservation cancelled" });
});

router.get("/wix/status", async (_req, res): Promise<void> => {
  if (!WIX_ENABLED) {
    res.json({ connected: false, message: "Wix credentials not configured" });
    return;
  }
  try {
    const siteId = await getSiteId();
    const locationId = await getReservationLocationId();
    const location = getCattolicaLocation();
    res.json({
      connected: !!siteId,
      siteId,
      tableReservationsInstalled: !!locationId,
      reservationLocationId: locationId,
      restaurant: location,
      message: locationId
        ? "Connesso a Wix Table Reservations - Ristorante Be Kind Cattolica"
        : siteId
          ? "Sito Wix connesso. Installa l'app 'Table Reservations' per collegare le prenotazioni. Nel frattempo le prenotazioni funzionano con il sistema locale."
          : "Impossibile trovare il sito Wix",
    });
  } catch (err: any) {
    res.json({ connected: false, message: err.message });
  }
});

export { router as reservationsRouter };
