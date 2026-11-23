/* TAM Black Friday 2026 funnel — shared page behaviour (reveal on scroll,
   popups, order buttons, share link). Ported 1:1 from assets/js/funnel.js;
   runs once per page after the markup is in the document. */
import { TAM_FUNNEL } from "./config";

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

export function initFunnel(root: HTMLElement) {
  if (root.dataset["funnelReady"]) return;
  root.dataset["funnelReady"] = "1";

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
  // Empty value keeps the preview popup. A URL sends every order button there instead.
  const checkoutUrl = TAM_FUNNEL.CHECKOUT_URL || "";
  if (checkoutUrl) {
    root.querySelectorAll('[data-open="order"]').forEach((a) => {
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

  // Two step order form (preview popup on the sales page)
  const order = document.getElementById("order");
  if (order) {
    const panels: Record<string, HTMLElement | null> = {
      "1": document.getElementById("step-1"),
      "2": document.getElementById("step-2"),
    };
    const tabs = order.querySelectorAll('[role="tab"]');
    const showStep = (n: string) => {
      Object.keys(panels).forEach((k) => {
        const p = panels[k];
        if (p) p.hidden = k !== n;
      });
      tabs.forEach((t) =>
        t.setAttribute("aria-selected", String(t.getAttribute("data-step") === n)),
      );
      order.scrollTop = 0;
      const heading = panels[n]?.querySelector("h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    };
    if (panels["2"]) panels["2"].hidden = true;
    order.querySelectorAll("[data-step]").forEach((el) => {
      el.addEventListener("click", () => showStep(el.getAttribute("data-step") ?? "1"));
    });
    const bump = document.getElementById("bump") as HTMLInputElement | null;
    const bumpRow = document.getElementById("bump-row");
    const total = document.getElementById("order-total");
    if (bump && bumpRow && total) {
      bump.addEventListener("change", () => {
        bumpRow.hidden = !bump.checked;
        total.textContent = bump.checked ? "$144" : "$97";
      });
    }
  }

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
