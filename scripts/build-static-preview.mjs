#!/usr/bin/env node
/* Static preview build for Cloudflare Pages (project tam-bf-2026-preview).

   1. Builds the app with VITE_BF_PREVIEW=1, which switches payments, forms and CRM
      tracking off (src/funnel/preview.ts).
   2. Asks the built server (dist/server/server.js) for every funnel route and saves the
      HTML it returns. The pages then hydrate from the hashed bundles in /assets, so no
      page loads a /src/*.ts path.
   3. Writes the result to pages-preview/site with noindex headers.

   Run:    node scripts/build-static-preview.mjs
   Deploy: see README, "Static preview on Cloudflare Pages". */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "pages-preview", "site");
const ROUTES = ["/", "/install", "/checkout", "/growth-accelerator", "/foundation", "/thank-you"];

execSync("npm run build", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, VITE_BF_PREVIEW: "1", VIBE_SANDBOX: "" },
});

// Clear the folder's contents, not the folder itself: on Windows the folder can be held open (EBUSY).
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) rmSync(join(out, name), { recursive: true, force: true });
cpSync(join(root, "dist", "client"), out, { recursive: true });

const server = (await import(pathToFileURL(join(root, "dist", "server", "server.js")).href)).default;

for (const route of ROUTES) {
  const res = await server.fetch(new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }));
  const html = await res.text();
  if (res.status !== 200) throw new Error(`${route} rendered with status ${res.status}`);
  if (/["'(]\/src\/[^"')]+\.tsx?/.test(html)) throw new Error(`${route} still loads a /src/*.ts path`);
  if (!html.includes('class="preview-note">Preview build.')) throw new Error(`${route} is missing the preview footer note`);
  const file = route === "/" ? "index.html" : `${route.slice(1)}.html`;
  writeFileSync(join(out, file), html);
  console.log(`rendered ${route} -> ${file} (${html.length} bytes)`);
}

// A Cloudflare build of the app (VIBE_SANDBOX=1) leaves .wrangler/deploy/config.json pointing at
// dist/server/wrangler.json. The build above replaces dist, so that pointer goes stale and Wrangler
// then refuses to run anywhere inside the repo. Drop the stale pointer (it is generated, not tracked).
const redirect = join(root, ".wrangler", "deploy", "config.json");
if (existsSync(redirect)) {
  let target = "";
  try {
    target = JSON.parse(readFileSync(redirect, "utf8")).configPath ?? "";
  } catch {
    /* unreadable: treat as stale */
  }
  if (!target || !existsSync(join(dirname(redirect), target))) {
    rmSync(redirect);
    console.log("removed stale .wrangler/deploy/config.json");
  }
}

// Preview site stays out of search, and is never cached stale between deploys.
writeFileSync(
  join(out, "_headers"),
  [
    "/*",
    "  X-Robots-Tag: noindex, nofollow",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: same-origin",
    "",
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
  ].join("\n"),
);
writeFileSync(join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");

console.log(`\nStatic preview ready: ${out}`);
console.log(readdirSync(out).join("  "));
process.exit(0);
