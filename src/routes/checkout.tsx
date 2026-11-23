import { createFileRoute } from "@tanstack/react-router";

import { FunnelPage } from "../funnel/FunnelPage";
import { MountInto } from "../funnel/FunnelPage";
import { Checkout } from "../funnel/CheckoutForm";
import html from "../funnel/pages/checkout.html?raw";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Hire Your AI Agent in 3 Days, Live" },
      {
        name: "description",
        content:
          "Complete your order for Hire Your AI Agent in 3 Days, Live. $97 one time for you and one teammate.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return (
    <FunnelPage html={html}>
      <MountInto id="checkout-app">
        <Checkout />
      </MountInto>
    </FunnelPage>
  );
}
