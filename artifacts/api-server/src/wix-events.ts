import { db, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const WIX_API_BASE = "https://www.wixapis.com";
const WIX_API_KEY = process.env.WIX_API_KEY!;
const WIX_ACCOUNT_ID = process.env.WIX_ACCOUNT_ID!;
const WIX_SITE_URL = "https://www.bekindcommunity.it";

let resolvedSiteId: string | null = null;
let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

function accountHeaders(): Record<string, string> {
  return {
    Authorization: WIX_API_KEY,
    "Content-Type": "application/json",
    "wix-account-id": WIX_ACCOUNT_ID,
  };
}

function siteHeaders(siteId: string): Record<string, string> {
  return {
    Authorization: WIX_API_KEY,
    "Content-Type": "application/json",
    "wix-site-id": siteId,
  };
}

async function rawFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${WIX_API_BASE}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const errorMsg = typeof data === "object" ? JSON.stringify(data) : data;
    throw new Error(`Wix Events API ${res.status}: ${errorMsg}`);
  }
  return data;
}

async function discoverSiteId(): Promise<string | null> {
  if (resolvedSiteId) return resolvedSiteId;
  try {
    const result = await rawFetch("/site-list/v2/sites/query", {
      method: "POST",
      headers: accountHeaders(),
      body: JSON.stringify({ query: {} }),
    });
    const sites = result?.sites || [];
    if (sites.length > 0) {
      resolvedSiteId = sites[0].id;
      return resolvedSiteId;
    }
  } catch (err: any) {
    console.error("[WixEvents] Failed to discover site:", err.message);
  }
  return null;
}

async function siteFetch(path: string, options: RequestInit = {}): Promise<any> {
  const siteId = await discoverSiteId();
  if (!siteId) throw new Error("No Wix site found");
  return rawFetch(path, {
    ...options,
    headers: {
      ...siteHeaders(siteId),
      ...(options.headers as Record<string, string> || {}),
    },
  });
}

export interface WixEvent {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  imageUrl: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  locationAddress: string;
  slug: string;
  status: string;
  registrationType: string;
  registrationStatus: string;
  currency: string;
  lowestPrice: string;
  highestPrice: string;
  isFree: boolean;
  ticketUrl: string;
}

function parseWixEvent(e: any): WixEvent {
  const dts = e.dateAndTimeSettings || {};
  const formatted = dts.formatted || {};
  const startDate = dts.startDate ? new Date(dts.startDate) : null;
  const endDate = dts.endDate ? new Date(dts.endDate) : null;

  const dateStr = startDate ? startDate.toISOString().split("T")[0] : "";
  const startTime = formatted.startTime || (startDate ? `${String(startDate.getUTCHours()).padStart(2, "0")}:${String(startDate.getUTCMinutes()).padStart(2, "0")}` : "");
  const endTime = formatted.endTime || (endDate ? `${String(endDate.getUTCHours()).padStart(2, "0")}:${String(endDate.getUTCMinutes()).padStart(2, "0")}` : "");

  const reg = e.registration || {};
  const tickets = reg.tickets || {};
  const isFree = tickets.lowestPrice?.value === "0" || tickets.lowestPrice?.value === "0.00" || reg.type === "RSVP";

  return {
    id: e.id,
    title: e.title || "",
    description: e.detailedDescription || e.shortDescription || "",
    shortDescription: e.shortDescription || "",
    imageUrl: e.mainImage?.url || null,
    date: dateStr,
    startTime,
    endTime,
    location: e.location?.name || "",
    locationAddress: e.location?.address?.formattedAddress || "",
    slug: e.slug || "",
    status: e.status || "UNKNOWN",
    registrationType: reg.type || "TICKETING",
    registrationStatus: reg.status || "CLOSED",
    currency: tickets.currency || "EUR",
    lowestPrice: tickets.lowestPrice?.value || "0",
    highestPrice: tickets.highestPrice?.value || "0",
    isFree,
    ticketUrl: `${WIX_SITE_URL}/event-details/${e.slug}`,
  };
}

export async function fetchWixEvents(): Promise<WixEvent[]> {
  try {
    const result = await siteFetch("/events/v3/events/query", {
      method: "POST",
      body: JSON.stringify({
        query: {
          paging: { limit: 100 },
          sort: [{ fieldName: "dateAndTimeSettings.startDate", order: "ASC" }],
        },
      }),
    });
    return (result?.events || []).map(parseWixEvent);
  } catch (err: any) {
    console.error("[WixEvents] Failed to fetch events:", err.message);
    return [];
  }
}

export async function fetchWixTicketDefinitions(eventId: string): Promise<any[]> {
  try {
    const result = await siteFetch(`/events/v1/ticket-definitions?eventId=${eventId}&limit=50`, {
      method: "GET",
    });
    return result?.definitions || [];
  } catch (err: any) {
    console.error("[WixEvents] Failed to fetch tickets for", eventId, err.message);
    return [];
  }
}

export async function createTicketReservation(eventId: string, ticketDefinitionId: string, quantity: number): Promise<any> {
  return siteFetch("/events/v1/checkout/reservations", {
    method: "POST",
    body: JSON.stringify({
      eventId,
      ticketQuantities: [{ ticketDefinitionId, quantity }],
    }),
  });
}

export async function checkoutReservation(
  eventId: string,
  reservationId: string,
  guest: { firstName: string; lastName: string; email: string; phone?: string }
): Promise<any> {
  return siteFetch("/events/v1/checkout", {
    method: "POST",
    body: JSON.stringify({
      eventId,
      reservationId,
      guests: [{
        form: {
          inputValues: [
            { inputName: "firstName", value: guest.firstName },
            { inputName: "lastName", value: guest.lastName },
            { inputName: "email", value: guest.email },
            ...(guest.phone ? [{ inputName: "phone", value: guest.phone }] : []),
          ],
        },
      }],
    }),
  });
}

export async function syncWixEventsToDb(): Promise<{ synced: number; errors: string[] }> {
  const now = Date.now();
  if (now - lastSyncTime < SYNC_INTERVAL_MS) {
    return { synced: 0, errors: [] };
  }

  const wixEvents = await fetchWixEvents();
  if (wixEvents.length === 0) {
    return { synced: 0, errors: ["No Wix events found or API unavailable"] };
  }

  let synced = 0;
  const errors: string[] = [];

  for (const we of wixEvents) {
    try {
      const [existing] = await db.select().from(eventsTable).where(eq(eventsTable.wixEventId, we.id)).limit(1);

      const eventData = {
        title: we.title,
        description: we.shortDescription || we.description || we.title,
        imageUrl: we.imageUrl,
        date: we.date,
        startTime: we.startTime,
        endTime: we.endTime,
        location: we.location + (we.locationAddress ? ` - ${we.locationAddress}` : ""),
        category: categorizeEvent(we.title),
        price: parseFloat(we.lowestPrice) || 0,
        maxParticipants: 50,
        isFree: we.isFree,
        wixEventId: we.id,
        wixSlug: we.slug,
        wixTicketUrl: we.ticketUrl,
        wixStatus: we.status,
      };

      if (existing) {
        await db.update(eventsTable).set(eventData).where(eq(eventsTable.id, existing.id));
      } else {
        await db.insert(eventsTable).values(eventData);
      }
      synced++;
    } catch (err: any) {
      errors.push(`${we.title}: ${err.message}`);
    }
  }

  lastSyncTime = now;
  console.log(`[WixEvents] Synced ${synced} events from Wix`);
  return { synced, errors };
}

function categorizeEvent(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("workshop") || t.includes("ceramica") || t.includes("stampa") || t.includes("kokedama") || t.includes("terrarium")) return "Workshop";
  if (t.includes("paint") || t.includes("sip")) return "Workshop";
  if (t.includes("brunch")) return "Brunch";
  if (t.includes("degustazione") || t.includes("tasting")) return "Degustazione";
  if (t.includes("yoga") || t.includes("meditazione")) return "Yoga";
  if (t.includes("musica") || t.includes("concerto") || t.includes("live")) return "Musica";
  return "Evento";
}

export function shouldSync(): boolean {
  return Date.now() - lastSyncTime >= SYNC_INTERVAL_MS;
}

export function resetSyncTimer(): void {
  lastSyncTime = 0;
}
