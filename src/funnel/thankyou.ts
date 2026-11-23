/* TAM Black Friday 2026 — /thank-you page.
   Wires the booking calendar to real availability, handles the teammate form. */
import { wireCalendar } from "./calendar";
import { fireTeammateTracking } from "./tracking";

const cfg = (window as any).TAM_FUNNEL;

const booker = document.getElementById("booker");
if (booker) {
  wireCalendar({
    container: booker,
    calendarId: cfg.CALENDAR_ID,
    locationId: cfg.LOCATION_ID,
    getContact: () => {
      const firstName = (booker.querySelector("#b-first") as HTMLInputElement)?.value?.trim() || "";
      const lastName = (booker.querySelector("#b-last") as HTMLInputElement)?.value?.trim() || "";
      const email = (booker.querySelector("#b-email") as HTMLInputElement)?.value?.trim() || "";
      const phone = (booker.querySelector("#b-phone") as HTMLInputElement)?.value?.trim() || "";
      return { firstName, lastName, email, phone };
    },
  });
}

// Teammate form — fire a tracking event so the teammate info is captured.
const teammateForm = document.getElementById("teammate-form") as HTMLFormElement | null;
if (teammateForm) {
  teammateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const teammateName = (teammateForm.querySelector("#t-name") as HTMLInputElement)?.value?.trim() || "";
    const teammateEmail = (teammateForm.querySelector("#t-email") as HTMLInputElement)?.value?.trim() || "";
    const note = teammateForm.querySelector("[data-preview-note]") as HTMLElement | null;
    fireTeammateTracking({
      email: teammateEmail,
      teammateName,
      teammateEmail,
    });
    if (note) {
      note.hidden = false;
      note.textContent = "Saved. We'll send your teammate their login.";
    }
    teammateForm.reset();
  });
}
