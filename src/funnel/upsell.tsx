/* TAM Black Friday 2026 — /growth-accelerator page.
   One-click upsell: $997 full price, then 6×$197 payment plan popup. */
import { createRoot } from "react-dom/client";
import { PaymentUpsellBlock } from "../integrations/payments";

const cfg = (window as any).TAM_FUNNEL;
const params = new URLSearchParams(window.location.search);
const showPlan = params.get("show") === "plan";

// $997 one-click upsell in the hero CTA area.
// Both accept and decline go to ?show=plan, which opens the payment-plan popup.
const upsellMount = document.getElementById("upsell-mount");
if (upsellMount) {
  if (cfg.UPSELL_PRODUCT_ID) {
    createRoot(upsellMount).render(
      <PaymentUpsellBlock
        productId={cfg.UPSELL_PRODUCT_ID}
        priceId={cfg.UPSELL_PRICE_ID || undefined}
        nextPath="/growth-accelerator?show=plan"
      />,
    );
  } else {
    upsellMount.innerHTML =
      '<p class="preview-flag"><strong>Setup needed.</strong> Add the 2027 Growth Accelerator product in More → Payments, then set UPSELL_PRODUCT_ID in <code>assets/js/config.js</code>.</p>';
  }
}

// $197/month payment-plan one-click upsell inside the plan popup.
const planMount = document.getElementById("plan-upsell-mount");
if (planMount) {
  if (cfg.PLAN_PRODUCT_ID) {
    createRoot(planMount).render(
      <PaymentUpsellBlock
        productId={cfg.PLAN_PRODUCT_ID}
        priceId={cfg.PLAN_PRICE_ID || undefined}
        nextPath="/foundation"
      />,
    );
  } else {
    planMount.innerHTML =
      '<p class="preview-flag"><strong>Setup needed.</strong> Add the payment-plan product in More → Payments, then set PLAN_PRODUCT_ID in <code>assets/js/config.js</code>.</p>';
  }
}

// Auto-open the plan popup when arriving from the $997 decision.
if (showPlan) {
  const plan = document.getElementById("plan");
  if (plan) {
    plan.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
}
