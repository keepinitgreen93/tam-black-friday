/* Shared helper: render a static HTML page's body verbatim inside a
   TanStack Start route, then load the page's funnel scripts as modules.
   The static design, copy, images and markup are preserved exactly. */
import { useEffect, useRef } from "react";

type StaticPageProps = {
  /** Raw HTML string (imported with ?raw) of the full static page. */
  html: string;
  /** Funnel script modules to load after hydration, e.g. ["./upsell.tsx"]. */
  scripts?: string[];
};

/** Extract the <body> inner HTML, minus the trailing <script> tags
   *  (we re-inject those as ES modules so Vite transforms them). */
function bodyInner(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = m ? m[1] : html;
  // strip trailing script tags — re-added as modules below
  body = body.replace(/<script[\s\S]*?<\/script>\s*$/gi, "").trim();
  return body;
}

export function StaticPage({ html, scripts = [] }: StaticPageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Load each funnel script as a module so Vite resolves/transforms it.
    for (const src of scripts) {
      const s = document.createElement("script");
      s.type = "module";
      // Vite serves src/ at /src/ in dev; in prod the build resolves it.
      s.src = src;
      s.async = true;
      document.body.appendChild(s);
    }
  }, [scripts]);

  return (
    <div
      ref={ref}
      className="static-page"
      dangerouslySetInnerHTML={{ __html: bodyInner(html) }}
    />
  );
}
