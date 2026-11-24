/* TAM Black Friday 2026 — /growth-accelerator one-click upsell.
   $997 one-click offer in the hero. Saying no (the block's own "No thanks" or the
   page's no-link) opens the 6 × $197 payment-plan popup, which holds a second
   one-click block. Every accept and the final decline continue to /foundation.

   Both blocks share the one-time upsell token from checkout. The token is spent as
   soon as either block accepts or declines, so the $997 "No thanks" (restyled as a small text link) is caught here
   and turned into "open the plan popup" instead of a decline. If that ever stops
   matching, the buyer simply continues to /foundation. */
import { useEffect, useState } from "react";

import { PaymentUpsellBlock } from "../integrations/payments";
import { MountInto } from "./FunnelPage";
import { openModal } from "./funnel";
import { IS_PREVIEW } from "./preview";
import { resolveFunnelProducts, type FunnelProducts } from "./products";
import { PaymentStyles, paymentTheme } from "./theme";

const NEXT_PATH = "/foundation";
const DECLINE_BUTTON = ".ghl-payment-checkout__offer-actions .ghl-payment-checkout__btn--secondary";

function SetupNeeded({ what, id }: { what: string; id: string }) {
  return (
    <p className="preview-flag" data-setup-needed={id}>
      <strong>Setup needed.</strong> Add the {what} in More → Payments, then set {id} in{" "}
      <code>src/funnel/config.ts</code>. <a href={NEXT_PATH}>Continue</a>
    </p>
  );
}

/** Static preview build: the offer buttons with no payment behind them.
    "Yes" says so on the page. "No" keeps the real path: plan popup, then /foundation. */
function UpsellPreview() {
  const [asked, setAsked] = useState<"full" | "plan" | null>(null);
  const note = (
    <p className="notice" role="status">
      <strong>Preview build.</strong> Payment is not connected on this preview page, so nothing
      was added or charged.
    </p>
  );
  return (
    <>
      <MountInto id="upsell-mount">
        <button type="button" className="btn" data-upsell-yes onClick={() => setAsked("full")}>
          Yes, Add the 2027 Growth Accelerator for $997
        </button>
        <button
          type="button"
          className="no-link"
          data-upsell-no
          onClick={() => {
            const plan = document.getElementById("plan");
            if (plan) openModal(plan);
          }}
        >
          No thanks, I'll continue with my $97 order.
        </button>
        {asked === "full" ? note : null}
      </MountInto>
      <MountInto id="plan-upsell-mount">
        <div className="cta-row">
          <button type="button" className="btn" data-plan-yes onClick={() => setAsked("plan")}>
            Yes, Split It Into 6 Payments of $197
          </button>
          <a className="no-link" href={NEXT_PATH} data-plan-no>
            No thanks, I'll continue with my $97 order.
          </a>
          {asked === "plan" ? note : null}
        </div>
      </MountInto>
    </>
  );
}

export function Upsell() {
  return IS_PREVIEW ? <UpsellPreview /> : <UpsellLive />;
}

function UpsellLive() {
  const [products, setProducts] = useState<FunnelProducts | null>(null);

  useEffect(() => {
    let live = true;
    void resolveFunnelProducts().then((p) => {
      if (live) setProducts(p);
    });
    return () => {
      live = false;
    };
  }, []);

  const hasPlan = Boolean(products?.plan);

  // "No thanks" on the $997 block opens the payment-plan popup instead of declining.
  useEffect(() => {
    if (!hasPlan) return;
    const mount = document.getElementById("upsell-mount");
    const plan = document.getElementById("plan");
    if (!mount || !plan) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target.closest(DECLINE_BUTTON) : null;
      if (!target || (target as HTMLButtonElement).disabled) return;
      e.preventDefault();
      e.stopPropagation();
      openModal(plan);
    };
    mount.addEventListener("click", onClick, true);
    return () => mount.removeEventListener("click", onClick, true);
  }, [hasPlan]);

  if (!products) return null;

  return (
    <>
      <PaymentStyles />
      <MountInto id="upsell-mount">
        {products.upsell ? (
          <div className="tam-checkout tam-checkout--offer tam-checkout--hero" style={paymentTheme}>
            <PaymentUpsellBlock
              productId={products.upsell.productId}
              priceId={products.upsell.priceId}
              nextPath={NEXT_PATH}
            />
          </div>
        ) : (
          <SetupNeeded what="2027 Growth Accelerator product" id="UPSELL_PRODUCT_ID" />
        )}
      </MountInto>
      <MountInto id="plan-upsell-mount">
        {products.plan ? (
          <div className="tam-checkout tam-checkout--offer tam-checkout--plan" style={paymentTheme}>
            <PaymentUpsellBlock
              productId={products.plan.productId}
              priceId={products.plan.priceId}
              nextPath={NEXT_PATH}
            />
          </div>
        ) : (
          <SetupNeeded what="payment-plan product" id="PLAN_PRODUCT_ID" />
        )}
      </MountInto>
    </>
  );
}
