import { createFileRoute } from "@tanstack/react-router";

import { FunnelPage } from "../funnel/FunnelPage";
import { initFoundation } from "../funnel/foundation";
import html from "../funnel/pages/foundation.html?raw";

export const Route = createFileRoute("/foundation")({
  head: () => ({
    meta: [
      { title: "AI Growth Foundation: Apply | Truly Authentic Marketing" },
      {
        name: "description",
        content:
          "The AI Growth Foundation is TAM's done for you implementation. It starts at $5,000. Apply and book a call to see if it's a fit.",
      },
    ],
  }),
  component: FoundationPage,
});

function FoundationPage() {
  return <FunnelPage html={html} onReady={initFoundation} />;
}
