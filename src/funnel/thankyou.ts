/* TAM Black Friday 2026 — /thank-you page.
   Loads the Product Champ booking calendar embed (the owner's own embed code) and
   handles the teammate form. */
import { fireTeammateTracking } from "./tracking";

const val = (root: ParentNode, sel: string) =>
  root.querySelector<HTMLInputElement>(sel)?.value?.trim() || "";

const EMBED_SCRIPT = "https://link.productchamp.io/js/form_embed.js";

/** A raw <script> inside server-rendered HTML never runs, so the embed script is added here, once. */
function loadCalendarEmbed() {
  if (document.querySelector(`script[src="${EMBED_SCRIPT}"]`)) return;
  const script = document.createElement("script");
  script.src = EMBED_SCRIPT;
  script.type = "text/javascript";
  script.async = true;
  document.body.appendChild(script);
}

export function initThankYou() {
  loadCalendarEmbed();

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
