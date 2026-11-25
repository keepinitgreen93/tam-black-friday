/* TAM Black Friday 2026 funnel — shared page behaviour (reveal on scroll,
   popups, order buttons, share link). Ported 1:1 from assets/js/funnel.js;
   runs once per page after the markup is in the document. */
import { TAM_FUNNEL } from "./config";
import { videoUrl } from "./media";
import { mountPlayer } from "./player";

let lastFocus: Element | null = null;

function focusables(root: Element): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null);
}

export function openModal(modal: HTMLElement) {
  lastFocus = document.activeElement;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
  const f = focusables(modal);
  f[0]?.focus();
}

export function closeModal(modal: HTMLElement) {
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
  if (location.hash === "#" + modal.id) {
    history.replaceState(history.state, "", location.pathname + location.search);
  }
  if (lastFocus instanceof HTMLElement) lastFocus.focus();
}

/** Called only after the video element reports a load error. The files are known to exist, so
    this never gates showing the player. "no" means the host answered 404/410 for the file, which
    is a real, permanent miss: the section is hidden. Anything else (network, 5xx, blocked) is
    "unknown", and the player shows its error panel with a retry button instead. */
async function probeVideoFile(src: string): Promise<"yes" | "no" | "unknown"> {
  try {
    const res = await fetch(src, { headers: { Range: "bytes=0-0" }, cache: "no-store" });
    void res.body?.cancel();
    if (res.status === 404 || res.status === 410) return "no";
    return res.ok ? "yes" : "unknown";
  } catch {
    return "unknown";
  }
}

/* Video sections: <section data-vsec hidden> holds an eyebrow, a <div data-vsl hidden> slot with
   <template><video ...></template>, and the button under the player.
   The markup names each file as /v/<file>; media.ts maps those to the public Product Champ
   Media Library URLs (video and poster) and the caption track to the Cloudflare function.
   The files are known to exist, so there is no pre-check: the shared branded player (player.ts)
   takes over the slot and the section is shown right away. A load error shows the player's error
   panel with a retry button; only a confirmed 404 hides the section (probeVideoFile). */
function initVsl(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[data-vsl]").forEach((slot) => {
    const tpl = slot.querySelector("template");
    const source = tpl?.content.querySelector("video");
    if (!tpl || !source || !source.getAttribute("src")) return;
    for (const el of [source, ...Array.from(source.querySelectorAll("track"))]) {
      for (const a of el === source ? ["src", "poster"] : ["src"]) {
        const v = el.getAttribute(a);
        if (v) el.setAttribute(a, videoUrl(v));
      }
    }
    const section = slot.closest<HTMLElement>("[data-vsec]");
    const hide = () => {
      slot.hidden = true;
      if (section) section.hidden = true;
      slot.replaceChildren(tpl);
    };
    const video = source.cloneNode(true) as HTMLVideoElement;
    mountPlayer(slot, video, { onMissing: hide, probe: probeVideoFile });
    slot.hidden = false;
    if (section) section.hidden = false;
  });
}

export function initFunnel(root: HTMLElement) {
  if (root.dataset["funnelReady"]) return;
  root.dataset["funnelReady"] = "1";

  initVsl(root);

  // Reveal on scroll. Content stays visible without JS, without IntersectionObserver,
  // or with reduced motion. Anything already on screen is marked revealed first so
  // server-rendered content never blinks out.
  const rv = root.querySelectorAll<HTMLElement>(".rv");
  if (rv.length && "IntersectionObserver" in window) {
    const fold = window.innerHeight * 0.92;
    rv.forEach((el) => {
      if (el.getBoundingClientRect().top < fold) el.classList.add("in");
    });
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    rv.forEach((el) => {
      if (!el.classList.contains("in")) io.observe(el);
    });
  }

  // $97 order buttons: one destination, set in src/funnel/config.ts (CHECKOUT_URL).
  // The buttons already link there in the markup; this keeps them in step with the config.
  const checkoutUrl = TAM_FUNNEL.CHECKOUT_URL || "";
  // Old links ended in #order (a popup that no longer exists): send them to checkout.
  if (checkoutUrl && location.hash === "#order") {
    location.replace(checkoutUrl);
    return;
  }
  if (checkoutUrl) {
    root.querySelectorAll('[data-open="order"], a[href="#order"]').forEach((a) => {
      a.setAttribute("href", checkoutUrl);
      a.removeAttribute("data-open");
    });
  }

  // Open / close wiring
  root.querySelectorAll("[data-open]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      const modal = document.getElementById(trigger.getAttribute("data-open") ?? "");
      if (!modal) return;
      e.preventDefault();
      openModal(modal);
    });
  });

  root.querySelectorAll<HTMLElement>(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
    modal.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal(modal);
      });
    });
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal(modal);
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables(modal);
      const first = f[0];
      const last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    if (location.hash === "#" + modal.id) openModal(modal);
  });

  // Copy share link
  const share = root.querySelector<HTMLElement>("[data-share]");
  if (share) {
    share.addEventListener("click", () => {
      const url = location.origin + "/";
      const done = () => {
        share.textContent = "Link copied";
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, () => {
          share.textContent = url;
        });
      } else {
        share.textContent = url;
      }
    });
  }
}
