import { createFileRoute } from "@tanstack/react-router";

import { FunnelPage } from "../funnel/FunnelPage";
import html from "../funnel/pages/index.html?raw";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Land More Clients Through the Holidays and the 2027 Slowdown | Truly Authentic Marketing" },
      { property: "og:title", content: "Land More Clients Through the Holidays and the 2027 Slowdown | Truly Authentic Marketing" },
      {
        name: "description",
        content:
          "How I help local service businesses land more clients through the holidays and the 2027 slowdown, without learning tech, babysitting AI chats, or adding hours to their week. 3 live sessions, December 8 to 10. $97 for you and a teammate.",
      },
      { property: "og:description", content: "How I help local service businesses land more clients through the holidays and the 2027 slowdown, without learning tech, babysitting AI chats, or adding hours to their week. 3 live sessions, December 8 to 10. $97 for you and a teammate." },
    ],
  }),
  component: InstallPage,
});

function InstallPage() {
  return <FunnelPage html={html} />;
}
