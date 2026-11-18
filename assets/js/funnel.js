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

  // Preview forms: never submit anywhere
  document.querySelectorAll("form[data-preview]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var next = form.getAttribute("data-next");
      if (next) { location.href = next; return; }
      var note = form.querySelector("[data-preview-note]");
      if (note) { note.hidden = false; }
    });
  });

  // Thank-you page: booking picker (preview only, no booking is made)
  var booker = document.getElementById("booker");
  if (booker) {
    var dayBox = booker.querySelector("[data-days]");
    var timeBox = booker.querySelector("[data-times]");
    var confirmBtn = booker.querySelector("[data-confirm]");
    var notice = booker.querySelector("[data-notice]");
    var picked = { day: null, time: null };
    var fmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
    var d = new Date();
    var made = 0;
    while (made < 8) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0 || d.getDay() === 6) { continue; }
      addChip(dayBox, fmt.format(d), "day");
      made += 1;
    }
    ["10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM"].forEach(function (t) { addChip(timeBox, t + " ET", "time"); });

    function addChip(box, label, kind) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        box.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        picked[kind] = label;
        notice.hidden = true;
      });
      box.appendChild(b);
    }

    confirmBtn.addEventListener("click", function () {
      notice.hidden = false;
      notice.textContent = (picked.day && picked.time)
        ? "Preview only. No call was booked for " + picked.day + " at " + picked.time + ". The live calendar connects in Product Champ."
        : "Pick a day and a time first.";
    });
  }

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
