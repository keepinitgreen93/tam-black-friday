/* TAM Black Friday 2026 — /checkout page.
   Mounts the sealed 2-step PaymentCheckoutBlock with the $47 order bump.
   Flow: order summary + bump → "Go to Payment" → block step 1 (contact) → step 2 (payment). */
import { createRoot } from "react-dom/client";
import { useLayoutEffect, useState } from "react";
import {
  PaymentCheckoutBlock,
  isCheckoutReturn,
} from "../integrations/payments";
import { fireBuyerTracking } from "./tracking";

const cfg = (window as any).TAM_FUNNEL;

function CheckoutApp() {
  const [bump, setBump] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const isReturn = isCheckoutReturn();
  const started = isReturn || showCheckout;

  // Persist selection before the block's useEffect reads it.
  // useLayoutEffect runs before child useEffect, so the selection is ready.
  useLayoutEffect(() => {
    if (!started || isReturn) return; // Don't overwrite on payment return
    const items: { priceId: string; quantity: number }[] = [
      { priceId: cfg.MAIN_PRICE_ID, quantity: 1 },
    ];
    if (bump && cfg.BUMP_PRICE_ID) {
      items.push({ priceId: cfg.BUMP_PRICE_ID, quantity: 1 });
    }
    localStorage.setItem(
      "vibe.checkout.selection.v1",
      JSON.stringify({ items }),
    );
  }, [bump, started, isReturn]);

  if (!cfg.MAIN_PRODUCT_ID || !cfg.MAIN_PRICE_ID) {
    return (
      <p className="preview-flag">
        <strong>Setup needed.</strong> Add the products in More → Payments, then
        set MAIN_PRODUCT_ID and MAIN_PRICE_ID in{" "}
        <code>assets/js/config.js</code>.
      </p>
    );
  }

  if (started) {
    return (
      <PaymentCheckoutBlock
        layout="two-step"
        fields={{ phone: "required", address: "hidden" }}
        upsellPath="/growth-accelerator"
        onSuccess={(order) => {
          if (order.buyer) {
            fireBuyerTracking(order.buyer);
          }
        }}
      />
    );
  }

  return (
    <>
      <div className="summary">
        <p>
          <b>Hire Your AI Agent in 3 Days, Live.</b> Tuesday, December 8 to
          Thursday, December 10, 12:00 to 1:30 PM Eastern. You plus one
          teammate. Replays, Starter Skills, Company Brain guide, Texting Ready
          Kit, 90 days of Product Champ, 90 days of a TAM hosted AI agent.
        </p>
        <div className="row">
          <span>Hire Your AI Agent in 3 Days, Live</span>
          <span>$97 one time</span>
        </div>
        {bump && (
          <div className="row">
            <span>Done With You Setup Check</span>
            <span>$47</span>
          </div>
        )}
        <div className="row total">
          <span>Total due today:</span>
          <span>{bump ? "$144" : "$97"}</span>
        </div>
      </div>

      <div className="bump">
        <h3>Done With You Setup Check</h3>
        <p>
          Get a TAM team member on a private screen share after Day 1 to check
          your Company Brain and agent are set up right, so Days 2 and 3 start
          clean.
        </p>
        <ul className="ticks">
          <li>
            A private 30 minute screen share with a TAM team member, booked
            within 14 days of the event.
          </li>
          <li>
            We check your Company Brain and agent together and fix what's off.
          </li>
          <li>You leave with a short list of what to do next.</li>
        </ul>
        <label className="check">
          <input
            type="checkbox"
            checked={bump}
            onChange={(e) => setBump(e.target.checked)}
          />
          <span>
            YES, add the Done With You Setup Check to my order for just $47.
          </span>
        </label>
      </div>

      <div className="cta-row">
        <button
          type="button"
          className="btn"
          onClick={() => setShowCheckout(true)}
        >
          Go to Payment
        </button>
      </div>
    </>
  );
}

const mount = document.getElementById("checkout-app");
if (mount) {
  createRoot(mount).render(<CheckoutApp />);
}
