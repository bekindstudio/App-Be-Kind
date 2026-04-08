const WIX_API_BASE = "https://www.wixapis.com";
const WIX_API_KEY = process.env.WIX_API_KEY!;
const WIX_ACCOUNT_ID = process.env.WIX_ACCOUNT_ID!;

let resolvedSiteId: string | null = null;

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
      console.log(`[Wix]   - ${site.displayName || site.name} (id: ${site.id}, published: ${site.published})`);
    }
    if (sites.length > 0) {
      resolvedSiteId = sites[0].id;
      console.log(`[Wix] Using site: ${resolvedSiteId}`);
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

export async function listWixServices(): Promise<any> {
  return siteFetch("/bookings/v2/services/query", {
    method: "POST",
    body: JSON.stringify({ query: {} }),
  });
}

export async function queryAvailability(
  serviceId: string,
  startDate: string,
  endDate: string,
  timezone = "Europe/Rome",
  slotsPerDay = 20
): Promise<any> {
  return siteFetch("/bookings/v1/availability/query", {
    method: "POST",
    body: JSON.stringify({
      query: {
        filter: {
          serviceId: [serviceId],
          startDate,
          endDate,
          bookable: true,
        },
        sort: [{ fieldName: "startDate", order: "ASC" }],
      },
      timezone,
      slotsPerDay,
    }),
  });
}

export async function createWixBooking(
  slot: any,
  contactDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  },
  numberOfParticipants: number,
  formInfo?: Record<string, any>
): Promise<any> {
  const body: any = {
    booking: {
      bookedEntity: { slot },
      contactDetails,
      numberOfParticipants,
    },
    flowControlSettings: {
      skipAvailabilityValidation: false,
      skipBusinessConfirmation: false,
    },
  };

  if (formInfo) {
    body.booking.formInfo = formInfo;
  }

  return siteFetch("/bookings/v2/bookings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function queryWixBookings(
  filter: Record<string, any> = {}
): Promise<any> {
  return siteFetch("/bookings/v2/bookings/query-extended", {
    method: "POST",
    body: JSON.stringify({
      query: {
        filter,
        sort: [{ fieldName: "createdDate", order: "DESC" }],
      },
    }),
  });
}

export async function cancelWixBooking(bookingId: string): Promise<any> {
  return siteFetch(`/bookings/v2/bookings/${bookingId}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      participantNotification: { notifyParticipants: true },
    }),
  });
}

export async function confirmWixBooking(bookingId: string): Promise<any> {
  return siteFetch(`/bookings/v2/bookings/${bookingId}/confirm`, {
    method: "POST",
    body: JSON.stringify({
      participantNotification: { notifyParticipants: true },
    }),
  });
}
