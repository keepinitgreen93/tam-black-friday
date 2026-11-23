/* TAM Black Friday 2026 — calendar booking wiring.
   Fetches real availability and submits bookings through the connected calendar. */
const BOOKING_API_URL = "https://backend.leadconnectorhq.com";
const VIBE_API_URL = "https://backend.leadconnectorhq.com/vibe-ai";

const getBrowserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const clampAvailabilityRange = (startMs: number, endMs: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = Math.max(startMs, today.getTime());
  const maxEndDate = startDate + 31 * 24 * 60 * 60 * 1000;
  const endDate = Math.min(Math.max(endMs, startDate), maxEndDate);
  return { startDate, endDate };
};

type SlotsByDate = Record<string, { slots: string[] }>;

async function fetchCalendarFreeSlots(
  calendarId: string,
  startMs: number,
  endMs: number,
): Promise<SlotsByDate> {
  const { startDate, endDate } = clampAvailabilityRange(startMs, endMs);
  const params = new URLSearchParams({
    startDate: String(startDate),
    endDate: String(endDate),
    timezone: getBrowserTimezone(),
  });
  const response = await fetch(`${BOOKING_API_URL}/calendars/${calendarId}/free-slots?${params}`);
  if (!response.ok) throw new Error("Failed to fetch calendar availability");
  return response.json();
}

type CustomFieldValue = { id: string; field_value: string };

async function submitCalendarBooking(payload: {
  locationId: string;
  calendarId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  selectedSlot: string;
  selectedTimezone?: string;
  sessionId?: string;
  customFields?: CustomFieldValue[];
}) {
  const response = await fetch(`${VIBE_API_URL}/booking/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      selectedTimezone: payload.selectedTimezone ?? getBrowserTimezone(),
      sessionId: payload.sessionId ?? crypto.randomUUID(),
      customFields: payload.customFields ?? [],
    }),
  });
  if (!response.ok) throw new Error("Booking submission failed");
  return response.json();
}

const dayFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
});

export interface WireCalendarOptions {
  container: HTMLElement;
  calendarId: string;
  locationId: string;
  getContact: () => {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  customFields?: CustomFieldValue[];
  onBooked?: () => void;
}

/** Wire an existing booking UI (#booker) to real calendar availability. */
export async function wireCalendar(opts: WireCalendarOptions) {
  const { container, calendarId, locationId } = opts;

  const dayBox = container.querySelector<HTMLElement>("[data-days]");
  const timeBox = container.querySelector<HTMLElement>("[data-times]");
  const confirmBtn = container.querySelector<HTMLButtonElement>("[data-confirm]");
  const notice = container.querySelector<HTMLElement>("[data-notice]");
  if (!dayBox || !timeBox || !confirmBtn || !notice) return;

  let pickedSlot: string | null = null;
  let pickedDay: string | null = null;

  // Fetch the next 14 days of availability
  const now = new Date();
  const startMs = now.getTime();
  const endMs = startMs + 14 * 24 * 60 * 60 * 1000;

  let slots: SlotsByDate;
  try {
    slots = await fetchCalendarFreeSlots(calendarId, startMs, endMs);
  } catch {
    notice.hidden = false;
    notice.textContent =
      "We couldn't load the calendar right now. Please refresh or try again later.";
    return;
  }

  const dates = Object.keys(slots)
    .filter((d) => (slots[d]?.slots?.length ?? 0) > 0)
    .sort();
  if (dates.length === 0) {
    notice.hidden = false;
    notice.textContent =
      "No calls are available in the next two weeks. Email us and we'll find a time.";
    return;
  }

  // Render day chips
  dayBox.innerHTML = "";
  for (const date of dates) {
    const d = new Date(date + "T12:00:00");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = dayFmt.format(d);
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      dayBox.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      pickedDay = date;
      pickedSlot = null;
      notice.hidden = true;
      // Render time chips for this day
      timeBox.innerHTML = "";
      for (const slot of slots[date]?.slots ?? []) {
        const slotDate = new Date(slot);
        const tb = document.createElement("button");
        tb.type = "button";
        tb.textContent = timeFmt.format(slotDate);
        tb.setAttribute("aria-pressed", "false");
        tb.addEventListener("click", () => {
          timeBox
            .querySelectorAll("button")
            .forEach((x) => x.setAttribute("aria-pressed", "false"));
          tb.setAttribute("aria-pressed", "true");
          pickedSlot = slot;
          notice.hidden = true;
        });
        timeBox.appendChild(tb);
      }
    });
    dayBox.appendChild(b);
  }

  confirmBtn.addEventListener("click", async () => {
    const contact = opts.getContact();
    if (!contact.firstName || !contact.lastName || !contact.email || !contact.phone) {
      notice.hidden = false;
      notice.textContent = "Please add your name, email and phone first.";
      return;
    }
    if (!pickedSlot) {
      notice.hidden = false;
      notice.textContent = "Pick a day and a time first.";
      return;
    }
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Booking…";
    notice.hidden = true;
    try {
      await submitCalendarBooking({
        locationId,
        calendarId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        selectedSlot: pickedSlot,
        ...(opts.customFields ? { customFields: opts.customFields } : {}),
      });
      notice.hidden = false;
      notice.textContent = "Your call is booked. Check your email for the confirmation.";
      confirmBtn.textContent = "Booked ✓";
      opts.onBooked?.();
    } catch {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Book My Call";
      notice.hidden = false;
      notice.textContent = "Something went wrong. Please try again or email us.";
    }
  });
}
