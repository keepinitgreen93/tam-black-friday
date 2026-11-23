import { createFileRoute } from "@tanstack/react-router";

import { FunnelPage } from "../funnel/FunnelPage";
import html from "../funnel/pages/index.html?raw";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Hire Your AI Agent in 3 Days, Live | Truly Authentic Marketing" },
      {
        name: "description",
        content:
          "Three live lunch sessions on Zoom, Tuesday, December 8 to Thursday, December 10, 12:00 to 1:30 PM Eastern. $97 one time for you and one teammate.",
      },
    ],
  }),
  component: InstallPage,
});

function InstallPage() {
  return <FunnelPage html={html} />;
}
