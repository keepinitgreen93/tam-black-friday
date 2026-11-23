/* =========================================================
   TAM Black Friday 2026 funnel — live configuration.
   Single place for the $97 order button destination and all
   product / price IDs used by the live checkout, upsell and
   payment plan. Wire every order button through CHECKOUT_URL.

   CHECKOUT_URL: the in-page 2-step checkout mount path.
     ""  -> buttons open the on-page order popup (preview only).
     "/checkout" -> every $97 order button opens the live
                    2-step checkout mounted on /checkout.
   ========================================================= */
window.TAM_FUNNEL = {
  // Where every "$97" order button on the sales page sends the buyer.
  CHECKOUT_URL: "/checkout",

  // Payments product / price IDs (created in More → Payments).
  // Main offer: "Hire Your AI Agent in 3 Days, Live" — $97 one time.
  MAIN_PRODUCT_ID: "",
  MAIN_PRICE_ID: "",

  // Optional order bump: "Done With You Setup Check" — $47 one time.
  BUMP_PRODUCT_ID: "",
  BUMP_PRICE_ID: "",

  // One-click upsell: "2027 Growth Accelerator" — $997 one time.
  UPSELL_PRODUCT_ID: "",
  UPSELL_PRICE_ID: "",

  // Payment plan upsell: "2027 Growth Accelerator" — 6 monthly payments of $197.
  PLAN_PRODUCT_ID: "",
  PLAN_PRICE_ID: "",

  // Contact tag applied to buyers at checkout step 1.
  BUYER_TAG: "bf2026-buyer",
  // Contact tag applied to foundation applicants.
  APPLICANT_TAG: "foundation-applicant",

  // Connected calendar (30-minute call).
  CALENDAR_ID: "VtxwSb5hWcA0kqXQJIP3",
  LOCATION_ID: "1YuXNjATfxW5vhLfX1pq",

  // Form tracking (foundation application).
  TRACKING_ID: "tk_319b928ae52d420c9c8f636580f71ac3",
  PROJECT_ID: "1794979071005660821"
};
