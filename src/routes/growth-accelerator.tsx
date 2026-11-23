import { createFileRoute } from "@tanstack/react-router";

import { FunnelPage } from "../funnel/FunnelPage";
import { Upsell } from "../funnel/UpsellOffer";
import html from "../funnel/pages/growth-accelerator.html?raw";

export const Route = createFileRoute("/growth-accelerator")({
  head: () => ({
    meta: [
      { title: "The 2027 Growth Accelerator | Truly Authentic Marketing" },
      {
        name: "description",
        content:
          "The 2027 Growth Accelerator: the guided path for owners who want to implement AI themselves. $997 this Black Friday week, regular price $1,497.",
      },
    ],
  }),
  component: GrowthAcceleratorPage,
});

function GrowthAcceleratorPage() {
  return (
    <FunnelPage html={html}>
      <Upsell />
    </FunnelPage>
  );
}
