/* TAM Black Friday 2026 — page shell.
   Each funnel page is the approved static markup (src/funnel/pages/*.html),
   server-rendered as is so design and copy stay exactly as signed off.
   Live pieces (checkout, upsell, forms) mount into the placeholders it holds. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { initFunnel } from "./funnel";
import { IS_PREVIEW, PREVIEW_FOOT_NOTE } from "./preview";

/** Preview build only: says so in the footer of every page. */
const withPreviewNote = (html: string) =>
  IS_PREVIEW
    ? html.replace(
        /(\s*<\/div>\s*<\/footer>)/,
        `\n    <p class="preview-note">${PREVIEW_FOOT_NOTE}</p>$1`,
      )
    : html;

type FunnelPageProps = {
  /** Body markup from src/funnel/pages/*.html. */
  html: string;
  /** Runs once after the markup is live in the browser (forms, calendar). */
  onReady?: ((root: HTMLElement) => void) | undefined;
  children?: ReactNode;
};

export function FunnelPage({ html, onReady, children }: FunnelPageProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const root = ref.current;
    if (!root || readyRef.current) return;
    readyRef.current = true;
    initFunnel(root);
    onReady?.(root);
  }, [onReady]);

  return (
    <>
      <div ref={ref} style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: withPreviewNote(html) }} />
      {children}
    </>
  );
}

/** Renders children into an element of the page markup (by id), once it exists. */
export function MountInto({ id, children }: { id: string; children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setEl(document.getElementById(id));
  }, [id]);
  return el ? createPortal(children, el) : null;
}
