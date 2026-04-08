const WIX_API_BASE = "https://www.wixapis.com";
const WIX_API_KEY = process.env.WIX_API_KEY!;
const WIX_ACCOUNT_ID = process.env.WIX_ACCOUNT_ID!;

let resolvedSiteId: string | null = null;
let cachedLocationId: string | null = null;

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
    throw new Error(`Wix API ${res.status}: ${errorMsg}`);
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
    console.log(`[Wix] Found ${sites.length} site(s)`);
    for (const site of sites) {
      console.log(`[Wix]   - ${site.displayName || site.name} (id: ${site.id})`);
    }
    if (sites.length > 0) {
      resolvedSiteId = sites[0].id;
      return resolvedSiteId;
    }
  } catch (err: any) {
    console.error("[Wix] Failed to discover site ID:", err.message);
  }
  return null;
}

async function siteFetch(path: string, options: RequestInit = {}): Promise<any> {
  const siteId = await discoverSiteId();
  if (!siteId) throw new Error("No Wix site found for this account");
  return rawFetch(path, {
    ...options,
    headers: {
      ...siteHeaders(siteId),
      ...(options.headers as Record<string, string> || {}),
    },
  });
}

export async function getSiteId(): Promise<string | null> {
  return discoverSiteId();
}

export async function listReservationLocations(): Promise<any> {
  try {
    return await siteFetch("/table-reservations/v1/reservation-locations", {
      method: "GET",
    });
  } catch (err: any) {
    console.error("[Wix] reservation-locations v1 failed:", err.message);
    return await siteFetch("/table-reservations/reservations/v1/reservation-locations", {
      method: "GET",
    });
  }
}

export async function getReservationLocationId(): Promise<string | null> {
  if (cachedLocationId) return cachedLocationId;
  try {
    const result = await listReservationLocations();
    const locations = result?.reservationLocations || [];
    console.log(`[Wix] Found ${locations.length} reservation location(s)`);
    for (const loc of locations) {
      console.log(`[Wix]   - ${loc.default ? "(default)" : ""} id: ${loc.id}, archived: ${loc.archived}`);
    }
    const active = locations.find((l: any) => !l.archived);
    if (active) {
      cachedLocationId = active.id;
      return cachedLocationId;
    }
  } catch (err: any) {
    console.error("[Wix] Failed to list reservation locations:", err.message);
  }
  return null;
}

export async function getTimeSlots(
  reservationLocationId: string,
  date: string,
  partySize: number
): Promise<any> {
  return siteFetch("/table-reservations/v1/time-slots", {
    method: "POST",
    body: JSON.stringify({
      reservationLocationId,
      date,
      partySize,
    }),
  });
}

export async function createHeldReservation(
  reservationLocationId: string,
  startDate: string,
  partySize: number
): Promise<any> {
  return siteFetch("/table-reservations/v1/reservations/held", {
    method: "POST",
    body: JSON.stringify({
      reservation: {
        reservationLocationId,
        details: {
          startDate,
          partySize,
        },
      },
    }),
  });
}

export async function reserveReservation(
  reservationId: string,
  revision: string,
  reservee: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  },
  additionalInfo?: string
): Promise<any> {
  const body: any = {
    revision,
    reservee,
  };
  if (additionalInfo) {
    body.additionalInfo = additionalInfo;
  }
  return siteFetch(`/table-reservations/v1/reservations/${reservationId}/reserve`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listReservations(
  filter: Record<string, any> = {}
): Promise<any> {
  return siteFetch("/table-reservations/v1/reservations/query", {
    method: "POST",
    body: JSON.stringify({
      query: {
        filter,
        sort: [{ fieldName: "createdDate", order: "DESC" }],
      },
    }),
  });
}

export async function getReservation(reservationId: string): Promise<any> {
  return siteFetch(`/table-reservations/v1/reservations/${reservationId}`, {
    method: "GET",
  });
}

export async function cancelReservation(
  reservationId: string,
  revision: string
): Promise<any> {
  return siteFetch(`/table-reservations/v1/reservations/${reservationId}`, {
    method: "PATCH",
    body: JSON.stringify({
      reservation: {
        status: "CANCELED",
      },
      revision,
    }),
  });
}
