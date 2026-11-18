# TAM Black Friday 2026: Hire Your AI Agent in 3 Days, Live

Static funnel for Truly Authentic Marketing. Plain HTML, CSS and JS. No build step, no server code, no secrets, no tracking.

## Pages

| Route | File | Job |
|---|---|---|
| `/` and `/install` | `index.html` | Sales page with the two step order popup |
| `/growth-accelerator` | `growth-accelerator.html` | Upsell, with the 6 payment popup on decline |
| `/foundation` | `foundation.html` | AI Growth Foundation application |
| `/thank-you` | `thank-you.html` | Booking calendar first, then Zoom and calendar details, then Product Champ login steps |

Shared files: `assets/css/styles.css`, `assets/js/funnel.js`, `assets/fonts/`, `assets/img/`, `assets/hire-your-ai-agent-live.ics`.

## Preview status

This build is a review preview. Nothing is wired:

- Order popup, application form, teammate form and booking picker collect nothing and send nothing. Inputs have no `name` attribute and the script never reads their values.
- Card fields are disabled.
- "Complete My Order" links to `/growth-accelerator`. Upsell yes and no both continue to `/foundation`. The application continues to `/thank-you`.
- Every page carries `noindex, nofollow`.

## Going live in Product Champ

Replace these when the funnel moves into Product Champ:

1. Order popup in `index.html` (`#order`): swap for the Product Champ order form and bump product.
2. Upsell buttons in `growth-accelerator.html`: wire the one click upsell and the 6 payment plan.
3. Application form in `foundation.html` (`#apply`) and the booking picker in `thank-you.html` (`#booker`): swap for the Product Champ form and calendar embed.
4. Teammate form in `thank-you.html`.
5. Remove the `Preview` notes, the `noindex` meta tags, `robots.txt` and the `X-Robots-Tag` header in `_headers`.
6. If Product Champ embeds need scripts or iframes, update the Content Security Policy meta tag on each page.

## Design system (v2)

TAM tokens: indigo family (`#6366F1`, `#4F46E5`, `#4338CA`), midnight `#0B1020`, coral `#FF7A66` for the single button style and badges. Display headings use Barlow Condensed 800 italic, UI text uses Manrope, body uses Open Sans. All fonts are self hosted.

Flow and pacing are modelled on a long form Black Friday sales letter: centered hero with the button above the fold, dashed ticket strip for the three days, dark gradient bands for story, white cards with overlapping pill badges for reading, a solid indigo band with numbered stack bars for the offer, a marquee ribbon, then fixes, math, terms, questions and a short closing letter with a P.S.

Scene images of Chris (`assets/img/chris-*.webp`) are AI illustrations made from approved brand photos. Exact words stay in HTML, never in the images. Sources are in `ATTRIBUTION.md`.

## Local preview

Any static server with clean URLs works, for example `npx wrangler pages dev .`

## Deploy (Cloudflare Pages preview)

Deploy a copy without the markdown files so they are not published:

```bash
rm -rf ../deploy && mkdir ../deploy && cp -r index.html growth-accelerator.html foundation.html thank-you.html assets _headers _redirects robots.txt ../deploy/
npx wrangler pages deploy ../deploy --project-name tam-bf-2026-preview --branch preview
```
