/* TAM Black Friday 2026 — /foundation page.
   Wires the application form (contact + tag) and the booking calendar. */
import { wireCalendar } from "./calendar";
import { TAM_FUNNEL as cfg } from "./config";
import { IS_PREVIEW } from "./preview";
import { fireFoundationApplication } from "./tracking";

// Custom field IDs registered for the 5 application questions.
const FIELD_IDS = {
  q1: { id: "tUf1i14Gl2wwCGlWvZTW", label: "What does your business do, and who do you serve?" },
  q2: { id: "HKNiujPZzxF0DXeDwB0s", label: "Framework or process to turn into a system" },
  q3: { id: "bEyPAN6yjZuoiiXLg74W", label: "What takes the most time in your week right now?" },
  q4: { id: "VT7CFHJMF068hPUwddAd", label: "Where do your documents and SOPs live today?" },
  q5: { id: "T3emr8bmKRTyx1j5rKMk", label: "When would you like to start?" },
} as const;

const val = (root: ParentNode, sel: string) =>
  root.querySelector<HTMLInputElement | HTMLTextAreaElement>(sel)?.value?.trim() || "";

export function initFoundation() {
  const form = document.getElementById("apply-form") as HTMLFormElement | null;
  const formCard = document.getElementById("apply-card");
  const calendarSection = document.getElementById("apply-calendar");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const firstName = val(form, "#af-first");
    const lastName = val(form, "#af-last");
    const email = val(form, "#af-email");
    const phone = val(form, "#af-phone");

    const note = form.querySelector<HTMLElement>("[data-apply-note]");
    if (!firstName || !lastName || !email || !phone) {
      if (note) {
        note.hidden = false;
        note.textContent = "Please add your name, email and phone so we can follow up.";
      }
      return;
    }

    if (IS_PREVIEW) {
      // Static preview build: no application is sent and no call is booked.
      if (note) {
        note.hidden = false;
        note.textContent =
          "Preview build. The application form is not connected yet, so nothing was sent.";
      }
      return;
    }

    const answers: Record<string, { value: string; label: string }> = {};
    (Object.keys(FIELD_IDS) as (keyof typeof FIELD_IDS)[]).forEach((k) => {
      answers[FIELD_IDS[k].id] = { value: val(form, `#af-${k}`), label: FIELD_IDS[k].label };
    });

    // Fire the tracking event (creates/updates contact, CRM tags foundation-applicant).
    fireFoundationApplication({ firstName, lastName, email, phone, answers });

    // Show the booking calendar.
    if (formCard) formCard.hidden = true;
    if (calendarSection) {
      calendarSection.hidden = false;
      calendarSection.scrollIntoView({ behavior: "smooth" });
      const booker = calendarSection.querySelector<HTMLElement>("#booker");
      if (booker) {
        void wireCalendar({
          container: booker,
          calendarId: cfg.CALENDAR_ID,
          locationId: cfg.LOCATION_ID,
          getContact: () => ({ firstName, lastName, email, phone }),
          onBooked: () => {
            setTimeout(() => {
              window.location.href = "/thank-you";
            }, 2500);
          },
        });
      }
    }
  });
}
