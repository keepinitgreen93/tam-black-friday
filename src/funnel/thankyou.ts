/* TAM Black Friday 2026 — /thank-you page.
   Wires the booking calendar to real availability, handles the teammate form. */
import { wireCalendar } from "./calendar";
import { TAM_FUNNEL as cfg } from "./config";
import { fireTeammateTracking } from "./tracking";

const val = (root: ParentNode, sel: string) =>
  root.querySelector<HTMLInputElement>(sel)?.value?.trim() || "";

export function initThankYou() {
  const booker = document.getElementById("booker");
  if (booker) {
    void wireCalendar({
      container: booker,
      calendarId: cfg.CALENDAR_ID,
      locationId: cfg.LOCATION_ID,
      getContact: () => ({
        firstName: val(booker, "#b-first"),
        lastName: val(booker, "#b-last"),
        email: val(booker, "#b-email"),
        phone: val(booker, "#b-phone"),
      }),
    });
  }

  // Teammate form — fire a tracking event so the teammate info is captured.
  const teammateForm = document.getElementById("teammate-form") as HTMLFormElement | null;
  if (teammateForm) {
    teammateForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const teammateName = val(teammateForm, "#t-name");
      const teammateEmail = val(teammateForm, "#t-email");
      const note = teammateForm.querySelector<HTMLElement>("[data-teammate-status]");
      if (!teammateEmail) {
        teammateForm.querySelector<HTMLInputElement>("#t-email")?.focus();
        return;
      }
      fireTeammateTracking({ teammateName, teammateEmail });
      if (note) {
        note.hidden = false;
        note.textContent = "Saved. We'll send your teammate their login.";
      }
      teammateForm.reset();
    });
  }
}
