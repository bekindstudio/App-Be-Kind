import { Router } from "express";
import { db, reservationsTable, usersTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";
import { CreateReservationBody, UpdateReservationBody } from "@workspace/api-zod";
import {
  listWixServices,
  queryAvailability,
  createWixBooking,
  queryWixBookings,
  cancelWixBooking,
  getSiteId,
} from "../wix-bookings";

const router = Router();

const WIX_ENABLED = !!(process.env.WIX_API_KEY && process.env.WIX_ACCOUNT_ID);

let cachedServiceId: string | null = null;
async function getWixServiceId(): Promise<string | null> {
  if (cachedServiceId) return cachedServiceId;
  try {
    const result = await listWixServices();
    const services = result?.services || [];
    if (services.length > 0) {
      cachedServiceId = services[0].id;
      console.log(`[Wix] Found service: ${services[0].name} (${cachedServiceId})`);
      return cachedServiceId;
    }
  } catch (err: any) {
    console.error("[Wix] Failed to list services:", err.message);
  }
  return null;
}

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

function formatWixBooking(booking: any) {
  const slot = booking.bookedEntity?.slot || {};
  const startDate = slot.startDate ? new Date(slot.startDate) : null;
  return {
    id: booking.bookingId || booking.id,
    date: startDate ? startDate.toISOString().split("T")[0] : "",
    time: startDate
      ? `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`
      : "",
    guests: booking.numberOfParticipants || 1,
    status: (booking.status || "").toLowerCase() === "confirmed"
      ? "confirmed"
      : (booking.status || "").toLowerCase() === "canceled"
        ? "cancelled"
        : booking.status?.toLowerCase() || "pending",
    notes: booking.additionalFields?.[0]?.value || "",
    createdAt: booking.createdDate || new Date().toISOString(),
    wixBookingId: booking.bookingId || booking.id,
  };
}

router.get("/availability", async (req, res): Promise<void> => {
  const { date } = req.query as { date: string; guests: string };
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
      const serviceId = await getWixServiceId();
      if (serviceId) {
        const startDate = `${date}T00:00:00.000Z`;
        const endDate = `${date}T23:59:59.000Z`;
        const result = await queryAvailability(serviceId, startDate, endDate);
        const entries = result?.availabilityEntries || [];

        const wixSlots = entries
          .filter((e: any) => e.bookable)
          .map((e: any) => {
            const start = new Date(e.slot.startDate);
            return `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
          });

        res.json({ date, availableSlots: wixSlots, closedDay: false, source: "wix" });
        return;
      }
    } catch (err: any) {
      console.error("[Wix] Availability query failed, falling back to local:", err.message);
    }
  }

  const reservedSlots = await db
    .select()
    .from(reservationsTable)
    .where(and(eq(reservationsTable.date, date), eq(reservationsTable.status, "confirmed")));

  const availableSlots = ALL_SLOTS.filter(
    (slot) => reservedSlots.filter((r) => r.time === slot).length < 4
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
        const result = await queryWixBookings({
          "contactDetails.email": { $eq: user.email },
        });
        const bookings = (result?.bookings || result?.extendedBookings || []).map((b: any) =>
          formatWixBooking(b.booking || b)
        );
        res.json(bookings);
        return;
      }
    } catch (err: any) {
      console.error("[Wix] Query bookings failed, falling back to local:", err.message);
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
      const serviceId = await getWixServiceId();
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (serviceId && user) {
        const [hours, minutes] = time.split(":").map(Number);
        const startDate = new Date(`${date}T00:00:00.000Z`);
        startDate.setUTCHours(hours, minutes, 0, 0);
        const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);

        const slot = {
          serviceId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          timezone: "Europe/Rome",
          location: { type: "BUSINESS" },
        };

        const nameParts = (user.name || "Guest").split(" ");
        const contactDetails = {
          firstName: nameParts[0] || "Guest",
          lastName: nameParts.slice(1).join(" ") || "",
          email: user.email,
          phone: user.phone || undefined,
        };

        const wixResult = await createWixBooking(slot, contactDetails, guests);
        const wixBooking = wixResult?.booking;

        if (wixBooking) {
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

          res.status(201).json({
            ...formatReservation(reservation),
            wixBookingId: wixBooking.bookingId || wixBooking.id,
          });
          return;
        }
      }
    } catch (err: any) {
      console.error("[Wix] Create booking failed, falling back to local:", err.message);
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

router.get("/wix/services", async (_req, res): Promise<void> => {
  if (!WIX_ENABLED) {
    res.json({ enabled: false, services: [] });
    return;
  }
  try {
    const result = await listWixServices();
    res.json({ enabled: true, services: result?.services || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/wix/status", async (_req, res): Promise<void> => {
  if (!WIX_ENABLED) {
    res.json({ connected: false, message: "Wix credentials not configured" });
    return;
  }
  try {
    const serviceId = await getWixServiceId();
    res.json({
      connected: !!serviceId,
      serviceId,
      message: serviceId
        ? "Connected to Wix Bookings"
        : "Connected but no booking services found",
    });
  } catch (err: any) {
    res.json({ connected: false, message: err.message });
  }
});

export { router as reservationsRouter };
