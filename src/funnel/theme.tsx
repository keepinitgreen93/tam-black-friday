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
  "--border": "#E1E5F0",
  "--radius": "10px",
  color: "#17153B",
  textAlign: "left",
  width: "100%",
} as CSSProperties;

const css = `
/* The checkout sits inside the 760px reading card: keep the block in one column there. */
.tam-checkout .ghl-payment-checkout__shell { grid-template-columns: 1fr; }
.tam-checkout .ghl-payment-checkout__aside { position: static; }
/* No product image uploaded in Payments: drop the grey "No image" placeholders. */
.tam-checkout .ghl-payment-checkout__offer-media:not(:has(img)),
.tam-checkout .ghl-payment-checkout__thumb:not(:has(img)) { display: none; }
.tam-checkout .ghl-payment-checkout__offer:not(:has(.ghl-payment-checkout__offer-media img)) { grid-template-columns: 1fr; max-width: 34rem; }
`;

export function PaymentStyles() {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
