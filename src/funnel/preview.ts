/* Static preview build switch.
   VITE_BF_PREVIEW=1 (set by scripts/build-static-preview.mjs) builds the pages for the
   Cloudflare Pages preview (tam-bf-2026-preview) with payments, forms and CRM tracking
   switched off. Unset, as in the AI Studio build, nothing here changes. */
export const IS_PREVIEW = import.meta.env["VITE_BF_PREVIEW"] === "1";

export const PREVIEW_FOOT_NOTE = "Preview build. No payment, form or tracking is connected.";
