/* TAM Black Friday 2026 — /checkout order form.
   Mounts the sealed 2-step PaymentCheckoutBlock on the page: one product, $97.
   Flow: order summary → "Go to Payment" → block step 1 (contact) → step 2 (payment)
   → /growth-accelerator (one-click upsell). */
import { useEffect, useLayoutEffect, useState } from "react";

import { PaymentCheckoutBlock, isCheckoutReturn } from "../integrations/payments";
import { resolveFunnelProducts, type FunnelProducts } from "./products";
import { PaymentStyles, paymentTheme } from "./theme";
import { fireBuyerTracking } from "./tracking";

const SELECTION_KEY = "vibe.checkout.selection.v1";

export function Checkout() {
  const [products, setProducts] = useState<FunnelProducts | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isReturn] = useState(() => isCheckoutReturn());
  const started = isReturn || showCheckout;

  useEffect(() => {
    let live = true;
    void resolveFunnelProducts().then((p) => {
      if (live) setProducts(p);
    });
    return () => {
      live = false;
    };
  }, []);

  const mainPriceId = products?.main?.priceId ?? "";

  // Persist the selection before the block's effect reads it.
  // useLayoutEffect runs before the child's useEffect, so the selection is ready.
  useLayoutEffect(() => {
    if (!started || isReturn || !mainPriceId) return; // Don't overwrite on payment return
    const items = [{ priceId: mainPriceId, quantity: 1 }];
    try {
      localStorage.setItem(SELECTION_KEY, JSON.stringify({ items }));
    } catch {
      /* storage refused: the block reports an empty cart */
    }
  }, [started, isReturn, mainPriceId]);

  if (isReturn) {
    return <CheckoutBlock />;
  }

  if (!products) return null;

  if (!products.main) {
    return (
      <p className="preview-flag" data-setup-needed="main">
        <strong>Setup needed.</strong> Add the products in More → Payments, then set MAIN_PRODUCT_ID
        and MAIN_PRICE_ID in <code>src/funnel/config.ts</code>.
      </p>
    );
  }

  if (started) {
    return <CheckoutBlock />;
  }

  return (
    <>
      <div className="summary">
        <p>
          <b>Hire Your AI Agent in 3 Days, Live.</b> Tuesday, December 8 to Thursday, December 10,
          12:00 to 1:30 PM Eastern. You plus one teammate. Replays, Starter Skills, Company Brain
          guide, Texting Ready Kit, 90 days of Product Champ, 90 days of a TAM hosted AI agent.
        </p>
        <div className="row">
          <span>Hire Your AI Agent in 3 Days, Live</span>
          <span>$97 one time</span>
        </div>
        <div className="row total">
          <span>Total due today:</span>
          <span>$97</span>
        </div>
      </div>

      <div className="cta-row">
        <button type="button" className="btn" onClick={() => setShowCheckout(true)}>
          Go to Payment
        </button>
      </div>
    </>
  );
}

function CheckoutBlock() {
  return (
    <div className="tam-checkout" style={paymentTheme}>
      <PaymentStyles />
      <PaymentCheckoutBlock
        layout="two-step"
        fields={{ phone: "required", address: "hidden" }}
        upsellPath="/growth-accelerator"
        onSuccess={(order) => {
          // Only reached when the one-click upsell cannot take over; the block
          // otherwise sends the buyer to /growth-accelerator itself.
          if (order.buyer) fireBuyerTracking(order.buyer);
          window.setTimeout(() => window.location.assign("/foundation"), 1500);
        }}
      />
    </div>
  );
}
