/* TAM Black Friday 2026 funnel. Preview behaviour only.
   Nothing here reads, stores or sends form values. No tracking. */
(function () {
  "use strict";

  var lastFocus = null;

  // Reveal on scroll. Content stays visible without JS, without IntersectionObserver, or with reduced motion.
  var rv = document.querySelectorAll(".rv");
  if (rv.length && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  }

  function focusables(root) {
    return Array.prototype.slice.call(
      root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function openModal(modal) {
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    var f = focusables(modal);
    if (f.length) { f[0].focus(); }
  }

  function closeModal(modal) {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    if (location.hash === "#" + modal.id) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  // $97 order buttons: one destination, set in assets/js/config.js (window.TAM_FUNNEL.CHECKOUT_URL).
  // Empty value keeps the preview popup. A URL sends every order button there instead.
  var checkoutUrl = (window.TAM_FUNNEL && window.TAM_FUNNEL.CHECKOUT_URL) || "";
  if (checkoutUrl) {
    document.querySelectorAll('[data-open="order"]').forEach(function (a) {
      a.setAttribute("href", checkoutUrl);
      a.removeAttribute("data-open");
    });
  }

  // Open / close wiring
  document.querySelectorAll("[data-open]").forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      var modal = document.getElementById(trigger.getAttribute("data-open"));
      if (!modal) { return; }
      e.preventDefault();
      openModal(modal);
    });
  });

  document.querySelectorAll(".modal").forEach(function (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) { closeModal(modal); }
    });
    modal.querySelectorAll("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.preventDefault(); closeModal(modal); });
    });
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeModal(modal); return; }
      if (e.key !== "Tab") { return; }
      var f = focusables(modal);
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    if (location.hash === "#" + modal.id) { openModal(modal); }
  });

  // Two step order form
  var order = document.getElementById("order");
  if (order) {
    var panels = { "1": document.getElementById("step-1"), "2": document.getElementById("step-2") };
    var tabs = order.querySelectorAll('[role="tab"]');
    var showStep = function (n) {
      Object.keys(panels).forEach(function (k) { panels[k].hidden = (k !== n); });
      tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.getAttribute("data-step") === n)); });
      var card = order.querySelector(".modal__card");
      if (card && card.scrollIntoView) { order.scrollTop = 0; }
      var heading = panels[n].querySelector("h2");
      if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
    };
    panels["2"].hidden = true;
    order.querySelectorAll("[data-step]").forEach(function (el) {
      el.addEventListener("click", function () { showStep(el.getAttribute("data-step")); });
    });
    var bump = document.getElementById("bump");
    var bumpRow = document.getElementById("bump-row");
    var total = document.getElementById("order-total");
    if (bump) {
      bump.addEventListener("change", function () {
        bumpRow.hidden = !bump.checked;
        total.textContent = bump.checked ? "$144" : "$97";
      });
    }
  }

  // Preview form + booker handlers removed — live wiring is in src/funnel/*.ts

  // Copy share link
  var share = document.querySelector("[data-share]");
  if (share) {
    share.addEventListener("click", function () {
      var url = location.origin + "/";
      var done = function () { share.textContent = "Link copied"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { share.textContent = url; });
      } else { share.textContent = url; }
    });
  }
})();
