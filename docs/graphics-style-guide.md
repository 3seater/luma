# Luma graphics — approved design rules

Approved by Jacob on September 16, 2026: “this design rule is great. save this for future designs”. This is the default reference for future Luma artwork, replacing Beam's blue/cyan graphics system for this project.

## Approved reference

- Route: `/social/docs-live`; native-size capture: `/social/docs-live?native=1`.
- Composition: `app/social/docs-live/page.tsx`.
- Exact styling: `app/social/docs-live/poster.css`.
- Logo: `LumaMark` in `components/Shell.tsx`, using `lib/luma-brand.ts`.
- Real docs: `components/LumaDocsShell.tsx`, `components/LumaDocsContent.tsx`, and `app/docs/docs.css`.
- Typeface: the site's local Geist font from `app/layout.tsx`.

Inspect the reference source before creating a new graphic. Preserve this approved route; create other subjects in their own routes.

## Medium and composition

Build real, editable HTML/CSS/SVG for browser capture and HTML-to-Figma import. Keep text selectable and SVG paths intact. Reuse actual product components, logos, icons, and current copy. Do not fabricate interfaces or flatten the entire composition into a bitmap. Use image generation only when the user explicitly requests it or a separate illustration/photo requires it.

Default to a 1920 × 1080 artboard. Scale the whole composition uniformly for smaller previews; do not let responsive breakpoints rearrange the artwork. Respect explicitly requested alternative dimensions.

Use a large, short, light-weight headline on the left and one dominant product visual on the right. Keep generous spacing. The logo sits at the upper left; the social handle and website sit at the lower left. A gently tilted product window may crop beyond the right and bottom edges. Keep the headline, logo, and identity badges fully visible.

For artwork about another subject, change the headline and relevant product visual while retaining the visual system. The docs announcement uses the real pinned sidebar, overview cards, and reader. Other graphics should use their corresponding real product components.

## Palette and material

- Midnight navy `#06162b`, steel blue `#254c6c`, sea-glass `#87b3bc`, warm sand `#dfcca1`.
- Approved background: `linear-gradient(180deg,#06162b 0%,#173a55 38%,#254c6c 60%,#87b3bc 91%,#dfcca1 100%)`.
- Headline and logo: soft white `#eef4f5`.
- Quiet oversized curved bands: `#ffffff06`; use the exact geometry in the reference CSS.
- Pale product surfaces, thin light borders, restrained translucent rims, and soft navy shadows.
- Preserve the exact Luma mark; no invented, redrawn, or oversized sculptural logo.
- Avoid neon, sparkles, excessive blur, extreme perspective, visual clutter, and unrelated decorative tokens.

## Approved placement at 1920 × 1080

| Element | Reference specification |
| --- | --- |
| Brand | Left 96px, top 80px; logo 76 × 64px; gap 16px |
| Wordmark | Lowercase `luma`; 59px, weight 450, tracking −3px |
| Headline | Left 96px, top 312px; 166px, weight 300, line-height 1.02, tracking −9.6px |
| Identity row | Left 96px, bottom 94px; gap 20px |
| Identity badges | 26px type, tracking −0.6px; padding 20px 25px; 19px radius; navy text; `#eef4f580` border; `#eef4f526` fill |
| Product window | Left 842px, top 166px; 1120 × 1200px; rotation −7deg; 29px radius |
| Window material | `#f5f8f8` surface; `#eef4f5b3` border; shadow `-22px 36px 90px -24px #06162b66, 0 0 0 8px #eef4f51a` |
| Window bar | 65px tall; 29px horizontal padding; pale `#edf3f2` background |

Use these as the starting template, adjusting only as needed for the subject or explicit user direction.

## Identity and copy

Follow `docs/copy-guide.md` for current product claims. Keep artwork copy short and factual, with detail supplied by the real product view.

- Twitter/X: **@uselumacash**, linked to `https://x.com/uselumacash`.
- Website: **useluma.cash**, linked to `https://useluma.cash`.
- Keep both lower-left badges, with an up-right arrow on the website badge.
- The earlier `@uselumapp` handle is superseded.
- Luma sends USDC on Arc. Do not reintroduce Beam's stocks, bundles, or swaps, or imply official Arc/Circle affiliation.

## Delivery and verification

1. Read this guide, the current copy guide, and the approved artboard source.
2. Create a separate social route with scoped styles, using relevant real components and public/demo data.
3. Hide global navigation, wallet controls, footers, and other capture clutter on the artboard. Never render private links or wallet secrets.
4. Check the browser at native size and a smaller preview: correct logo and identity, contrast, spacing, intentional cropping, and no layout reflow.
5. Provide the preview link and native-size link for editable capture; identify localhost-only links. Export an image when requested and available. Do not claim an export or public deployment exists unless it does.
6. A request for artwork does not by itself request publication or deployment.

“Use our Luma design rules” and “like the docs announcement” mean this approved reference. New explicit user direction takes precedence. No repeat approval is needed to use this system for future requested designs.
