import { createFileRoute } from "@tanstack/react-router";

import { FunnelPage } from "../funnel/FunnelPage";
import { initThankYou } from "../funnel/thankyou";
import html from "../funnel/pages/thank-you.html?raw";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "You're in | Hire Your AI Agent in 3 Days, Live" },
      {
        name: "description",
        content:
          "Your seat is saved for Tuesday, December 8 to Thursday, December 10, 12:00 to 1:30 PM Eastern.",
      },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return <FunnelPage html={html} onReady={initThankYou} />;
}
