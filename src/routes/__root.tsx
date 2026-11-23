import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { reportVibeError } from "../lib/vibe-error-reporting";

// The funnel ships its own approved stylesheet and self-hosted fonts from
// public/assets (served at /static/...). Tailwind's src/styles.css is left in
// the project but is NOT loaded: its reset would change the signed-off design.
const FUNNEL_CSS = "/static/css/styles.css";

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main id="main">
      <header className="hero hero--step" style={{ minHeight: "100vh" }}>
        <div className="wrap">
          <div className="site-head">
            <img
              src="/static/img/tam-logo-white.png"
              alt="Truly Authentic Marketing"
              width={430}
              height={220}
            />
          </div>
          <h1 className="display">
            <span className="b">{title}</span>
          </h1>
          {children}
        </div>
      </header>
    </main>
  );
}

function NotFoundComponent() {
  return (
    <Notice title="Page not found">
      <p className="hero__sub">The page you're looking for doesn't exist or has been moved.</p>
      <div className="cta-row">
        <a className="btn" href="/">
          Go home
        </a>
      </div>
    </Notice>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportVibeError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <Notice title="This page didn't load">
      <p className="hero__sub">
        Something went wrong on our end. You can try refreshing or head back home.
      </p>
      <div className="cta-row">
        <button
          type="button"
          className="btn"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </button>
        <a className="no-link" href="/">
          Go home
        </a>
      </div>
    </Notice>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hire Your AI Agent in 3 Days, Live | Truly Authentic Marketing" },
    ],
    links: [
      { rel: "icon", href: "/static/img/favicon.svg", type: "image/svg+xml" },
      {
        rel: "preload",
        href: "/static/fonts/barlowcondensed-800i-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/static/fonts/manrope-var-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: FUNNEL_CSS },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    // The funnel script adds a class to <html> for reveal-on-scroll.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
