/* Brand fit for the sealed payment blocks (checkout + one-click upsell).
   The blocks are styled by the hosted script; these are the only knobs used:
   the standard theme variables it reads, and a few layout rules so it sits
   cleanly inside the funnel's reading-width card and popup. */
import type { CSSProperties } from "react";

export const paymentTheme = {
  "--primary": "#4338CA",
  "--primary-foreground": "#FFFFFF",
  "--foreground": "#17153B",
  "--ring": "#4338CA",
  "--border": "#D9DDEA",
  "--radius": "6px",
  color: "#17153B",
  textAlign: "left",
  width: "100%",
} as CSSProperties;

const css = `
/* ---------- Shared: the sealed blocks, restyled to the funnel (CSS only; every provider handler stays live) ---------- */
.tam-checkout { --tam-line: #D9DDEA; --tam-field: #8E97B0; --tam-ink: #17153B; --tam-slate: #3F4763; }
.tam-checkout .ghl-payment-checkout { font-family: var(--font-body, "Open Sans", system-ui, sans-serif); color: var(--tam-ink); }
.tam-checkout .ghl-payment-checkout__shell { grid-template-columns: 1fr; }
.tam-checkout .ghl-payment-checkout__aside { position: static; }
/* No product image uploaded in Payments: drop the grey "No image" placeholders. */
.tam-checkout .ghl-payment-checkout__offer-media,
.tam-checkout .ghl-payment-checkout__thumb { display: none; }
/* Primary action: the funnel's own coral button. */
.tam-checkout .ghl-payment-checkout__btn:not(.ghl-payment-checkout__btn--secondary) {
  width: 100%; min-height: 60px; padding: 14px 20px; border: 0; border-radius: 6px;
  background: #FF7A66; color: #060914; box-shadow: none;
  font-family: var(--font-ui, "Manrope", system-ui, sans-serif); font-weight: 800; font-size: 1.12rem; line-height: 1.2; letter-spacing: -0.01em;
}
.tam-checkout .ghl-payment-checkout__btn:not(.ghl-payment-checkout__btn--secondary):hover:not(:disabled) { background: #FF8E7C; }
.tam-checkout .ghl-payment-checkout__btn:not(.ghl-payment-checkout__btn--secondary):disabled { opacity: 0.55; cursor: not-allowed; }
.tam-checkout .ghl-payment-checkout__btn:focus-visible { outline: 3px solid #4338CA; outline-offset: 3px; }

/* ---------- /checkout: ONE continuous form inside the page card ---------- */
.tam-checkout--form .ghl-payment-checkout__shell { display: flex; flex-direction: column; gap: 0; }
.tam-checkout--form .ghl-payment-checkout__aside { order: -1; }
.tam-checkout--form .ghl-payment-checkout,
.tam-checkout--form .ghl-payment-checkout__shell,
.tam-checkout--form .ghl-payment-checkout__aside,
.tam-checkout--form .ghl-payment-checkout__main { width: 100%; max-width: none; margin-left: 0; margin-right: 0; }
.tam-checkout--form .ghl-payment-checkout__card {
  background: transparent; border: 0; box-shadow: none; border-radius: 0; padding: 0; margin: 0;
}
.tam-checkout--form .ghl-payment-checkout__main { display: block; padding-top: 22px; margin-top: 22px; border-top: 1px solid var(--tam-line); }
.tam-checkout--form .ghl-payment-checkout__main > .ghl-payment-checkout__subtitle:first-child {
  margin: 0 0 6px; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--tam-slate);
}
.tam-checkout--form .ghl-payment-checkout__title {
  margin: 0; font-family: var(--font-ui, "Manrope", system-ui, sans-serif); font-weight: 800; font-size: 1.15rem; line-height: 1.25; letter-spacing: -0.01em; color: var(--tam-ink);
}
.tam-checkout--form .ghl-payment-checkout__subtitle { margin: 4px 0 0; font-size: 0.92rem; line-height: 1.45; color: var(--tam-slate); }
.tam-checkout--form .ghl-payment-checkout__section { display: grid; gap: 14px; margin: 0 0 16px; }
.tam-checkout--form .ghl-payment-checkout__grid-2 { display: grid; grid-template-columns: 1fr; gap: 14px; }
.tam-checkout--form .ghl-payment-checkout__field { display: grid; gap: 6px; margin: 0; }
.tam-checkout--form .ghl-payment-checkout__field label,
.tam-checkout--form .ghl-payment-checkout__coupon label { font-family: var(--font-body, "Open Sans", system-ui, sans-serif); font-weight: 700; font-size: 0.95rem; color: var(--tam-ink); }
.tam-checkout--form .ghl-payment-checkout__input,
.tam-checkout--form .ghl-payment-checkout__select {
  width: 100%; min-height: 48px; padding: 11px 14px; font: inherit; font-size: 1rem; color: var(--tam-ink);
  background: #fff; border: 1px solid var(--tam-field); border-radius: 6px; box-shadow: none;
}
.tam-checkout--form .ghl-payment-checkout__input:focus-visible,
.tam-checkout--form .ghl-payment-checkout__select:focus-visible { outline: 3px solid #4338CA; outline-offset: 2px; }
/* Order summary reads as the top of the same form: one line item, coupon, total. */
.tam-checkout--form .ghl-payment-checkout__aside .ghl-payment-checkout__title { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--tam-slate); }
.tam-checkout--form .ghl-payment-checkout__summary-list { list-style: none; margin: 10px 0 0; padding: 0; }
.tam-checkout--form .ghl-payment-checkout__summary-line { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 12px 0; border-top: 1px solid var(--tam-line); }
.tam-checkout--form .ghl-payment-checkout__summary-line p { font-family: var(--font-ui, "Manrope", system-ui, sans-serif); }
.tam-checkout--form .ghl-payment-checkout__summary-line .ghl-payment-checkout__subtitle { font-family: var(--font-body, "Open Sans", system-ui, sans-serif); margin: 2px 0 0; }
.tam-checkout--form .ghl-payment-checkout__summary-line > p:last-of-type { white-space: nowrap; }
.tam-checkout--form .ghl-payment-checkout__summary-total { margin-top: 6px; padding-top: 10px; border-top: 1px solid var(--tam-line); display: grid; gap: 6px; }
.tam-checkout--form .ghl-payment-checkout__summary-row { display: flex; justify-content: space-between; gap: 16px; font-size: 0.98rem; }
.tam-checkout--form .ghl-payment-checkout__summary-row--total { font-family: var(--font-ui, "Manrope", system-ui, sans-serif); font-weight: 800; font-size: 1.15rem; }
.tam-checkout--form .ghl-payment-checkout__muted { color: var(--tam-slate); }
.tam-checkout--form .ghl-payment-checkout__coupon { margin-top: 4px; }
.tam-checkout--form .ghl-payment-checkout__coupon-row { display: flex; gap: 8px; }
.tam-checkout--form .ghl-payment-checkout__coupon-row .ghl-payment-checkout__input { flex: 1 1 auto; }
.tam-checkout--form .ghl-payment-checkout__coupon-btn {
  flex: 0 0 auto; min-height: 48px; padding: 0 18px; border-radius: 6px; border: 1px solid var(--tam-line); background: #F6F7FB; color: var(--tam-slate); font-family: var(--font-ui, "Manrope", system-ui, sans-serif); font-weight: 700; font-size: 0.95rem; cursor: pointer;
}
/* Quantity is always 1 on this order: no stepper, no Remove. */
.tam-checkout--form .ghl-payment-checkout__line-edit,
.tam-checkout--form .ghl-payment-checkout__stepper,
.tam-checkout--form .ghl-payment-checkout__remove { display: none; }
.tam-checkout--form .ghl-payment-checkout__turnstile { margin: 0 0 12px; }
.tam-checkout--form .ghl-payment-checkout__error,
.tam-checkout--form .ghl-payment-checkout__error-inline { margin: 8px 0; font-size: 0.92rem; }

/* ---------- Upsell + plan popup: one primary button, one small decline link ---------- */
.tam-checkout--offer .ghl-payment-checkout__card,
.tam-checkout--offer .ghl-payment-checkout__offer {
  display: block; background: transparent; border: 0; box-shadow: none; border-radius: 0; padding: 0; margin: 0; max-width: none;
}
.tam-checkout--offer .ghl-payment-checkout__section { display: grid; gap: 0; margin: 0; padding: 0; }
/* The hero above already shows the $997 price, so the block shows only the actions. */
.tam-checkout--offer .ghl-payment-checkout__offer-name,
.tam-checkout--offer .ghl-payment-checkout__field,
.tam-checkout--offer .ghl-payment-checkout__summary-total,
.tam-checkout--offer .ghl-payment-checkout__offer-qty { display: none; }
.tam-checkout--offer .ghl-payment-checkout__offer-price { display: none; }
.tam-checkout--offer .ghl-payment-checkout__subtitle { display: none; }
/* The plan popup keeps one quiet price line so the buyer sees what the button does. */
.tam-checkout--plan .ghl-payment-checkout__offer-price,
.tam-checkout--plan .ghl-payment-checkout__section > div:first-child .ghl-payment-checkout__subtitle { display: inline; margin: 0; font-family: var(--font-ui, "Manrope", system-ui, sans-serif); font-weight: 800; font-size: 1.1rem; color: #17153B; }
.tam-checkout--plan .ghl-payment-checkout__section > div:first-child { margin: 0 0 16px; text-align: center; }
.tam-checkout--plan .ghl-payment-checkout__section > div:first-child .ghl-payment-checkout__subtitle::before { content: "\\00a0\\00b7\\00a0"; }
.tam-checkout--offer .ghl-payment-checkout__turnstile { margin: 0; }
.tam-checkout--offer .ghl-payment-checkout__error { margin: 0 0 10px; font-size: 0.9rem; text-align: center; }
.tam-checkout--offer .ghl-payment-checkout__offer-actions { display: flex; flex-direction: column; align-items: stretch; gap: 6px; margin: 0; }
.tam-checkout--offer .ghl-payment-checkout__offer-actions .ghl-payment-checkout__btn--secondary {
  align-self: center; width: auto; min-height: 44px; padding: 10px 14px; border: 0; border-radius: 4px; background: transparent; box-shadow: none;
  font-family: var(--font-body, "Open Sans", system-ui, sans-serif); font-weight: 400; font-size: 0.95rem; line-height: 1.3;
  color: #3F4763; text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
}
.tam-checkout--offer .ghl-payment-checkout__offer-actions .ghl-payment-checkout__btn--secondary:hover { background: transparent; text-decoration-thickness: 2px; }
.tam-checkout--hero { max-width: 620px; margin: 0 auto; }
.tam-checkout--hero .ghl-payment-checkout__offer-actions .ghl-payment-checkout__btn--secondary { color: #C3C9DE; }
@media (min-width: 600px) {
  .tam-checkout--form .ghl-payment-checkout__grid-2 { grid-template-columns: 1fr 1fr; }
  .tam-checkout--form .ghl-payment-checkout__span-2 { grid-column: 1 / -1; }
}
`;

export function PaymentStyles() {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
