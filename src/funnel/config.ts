/* =========================================================
   TAM Black Friday 2026 funnel — live configuration.
   Single place for the $97 order button destination and all
   product / price IDs used by the checkout, upsell and
   payment plan.

   PRODUCT / PRICE IDS — three ways to supply them, first match wins:
     1. Env vars (VITE_BF_*), e.g. in .env.
     2. Paste the IDs into the IDS object below.
     3. Leave both blank: the funnel looks the products up in this
        project's Payments catalog (More → Payments) by price:
          $97 one time  -> main offer
          $997 one time -> 2027 Growth Accelerator
          $197 recurring -> 6 payment plan
        See src/funnel/products.ts.
   ========================================================= */

// Option 2: paste IDs here (More → Payments → product → copy ID).
const IDS = {
  // Main offer: "Hire Your AI Agent in 3 Days, Live" — $97 one time.
  MAIN_PRODUCT_ID: "",
  MAIN_PRICE_ID: "",
  // One-click upsell: "2027 Growth Accelerator" — $997 one time.
  UPSELL_PRODUCT_ID: "",
  UPSELL_PRICE_ID: "",
  // Payment plan upsell: "2027 Growth Accelerator" — 6 monthly payments of $197.
  PLAN_PRODUCT_ID: "",
  PLAN_PRICE_ID: "",
};

const pick = (envValue: unknown, fallback: string): string =>
  (typeof envValue === "string" && envValue.trim()) || fallback;

export const TAM_FUNNEL = {
  // Where every "$97" order button on the sales page sends the buyer.
  CHECKOUT_URL: "/checkout",

  MAIN_PRODUCT_ID: pick(import.meta.env["VITE_BF_MAIN_PRODUCT_ID"], IDS.MAIN_PRODUCT_ID),
  MAIN_PRICE_ID: pick(import.meta.env["VITE_BF_MAIN_PRICE_ID"], IDS.MAIN_PRICE_ID),
  UPSELL_PRODUCT_ID: pick(import.meta.env["VITE_BF_UPSELL_PRODUCT_ID"], IDS.UPSELL_PRODUCT_ID),
  UPSELL_PRICE_ID: pick(import.meta.env["VITE_BF_UPSELL_PRICE_ID"], IDS.UPSELL_PRICE_ID),
  PLAN_PRODUCT_ID: pick(import.meta.env["VITE_BF_PLAN_PRODUCT_ID"], IDS.PLAN_PRODUCT_ID),
  PLAN_PRICE_ID: pick(import.meta.env["VITE_BF_PLAN_PRICE_ID"], IDS.PLAN_PRICE_ID),

  // Contact tag applied to buyers at checkout step 1.
  BUYER_TAG: "bf2026-buyer",
  // Contact tag applied to foundation applicants.
  APPLICANT_TAG: "foundation-applicant",

  // Connected calendar (30-minute call).
  CALENDAR_ID: "VtxwSb5hWcA0kqXQJIP3",
  LOCATION_ID: "1YuXNjATfxW5vhLfX1pq",

  // Form tracking (foundation application).
  TRACKING_ID: "tk_319b928ae52d420c9c8f636580f71ac3",
  PROJECT_ID: "1794979071005660821",
};
