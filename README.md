# Yet Another Educational Resource

Curated by DeiAsPie

A minimalist, fast personal site for sharing recommendations for tools, services, and courses. Built with Hugo + Tailwind, deployed to GitHub Pages.

Dark mode is the default. Use the Theme toggle in the header to switch; your choice is remembered in localStorage.

## ✨ Features

- **🚀 Performance**: AVIF/WebP images, lazy loading, service worker caching, prefetching
- **♿ Accessibility**: WCAG 2.2 compliant, ARIA best practices, keyboard navigation, screen reader optimized
- **🔒 Security**: Content Security Policy, Subresource Integrity, secure Hugo configuration
- **🎨 Modern Stack**: Hugo + Tailwind CSS v4, responsive design, dark mode support
- **📦 PWA Ready**: Service worker, offline support, installable
- **🧪 Well-tested**: Playwright E2E, Axe accessibility audits, Lighthouse performance checks

## Local development

Prereqs: Hugo Extended v0.151.0+ and Node.js 20+

```fish
# install deps
npm install

# run dev server
hugo server -D
```

## Content model (new flow)

Preferred: page bundles with minimal front matter. Create a folder and an `index.md`:

```
content/recommendations/my-tool/
	index.md
	logo.png   # optional; first image is auto-used if `image` is omitted
```

Minimal front matter:

```yaml
---
title: "My Tool"
link: "https://example.com"
---
```

- Image: omit `image` to auto-pick the first image in the folder. Remote URLs still work if you prefer.
- Summary: omit `summary` to auto-use the first sentence of the content for cards.
- Tags/Categories: optional.

### Directory structure

Key paths used by the site:

- `content/` — Markdown content
  - `content/recommendations/` — All recommendations
  - `content/recommendations/courses/` — Courses hub. Each course is a page with an `area` for grouping
  - `content/about/` — About page
- `themes/curated/` — Theme templates and partials
- `assets/css/main.css` — Tailwind entry and small component styles
- `static/` — Images and static assets served as-is

### Images

- Preferred: page bundles. Place your image next to `index.md`; omit `image` in front matter to auto-pick the first local image. This keeps content portable and avoids path mismatches.
- Legacy paths under `static/` still work, but new content should colocate images with the page.

Responsive optimization (added):

- Partial `responsive-image.html` auto-generates multiple widths (WebP + original) and emits `<picture>` with `srcset` & `sizes`.
- Pages default widths: `320,480,640,800,1024`; cards: `200,320,400`.
- Remote URLs & SVG images bypass processing.
- Fallback letter tile is shown when no image exists.

Manual usage (normally not required):

```go-html-template
{{ partial "responsive-image.html" (dict
	"Page" .
	"Src" .Params.image
	"Alt" (printf "%s image" .Title)
	"Class" "w-full mb-6"
	"Widths" (slice 320 640 1024)
	"Sizes" "(max-width: 900px) 100vw, 800px"
) }}
```

Future ideas: AVIF source, blur placeholder, selective hero preloading.

### Fonts

System stack by default. Optional non-blocking Google Fonts load via `params.googleFonts` (query portion after `css2?`). Example:

```toml
[params]
googleFonts = "family=Inter:wght@400;600;700&display=swap"
```

The `fonts.html` partial:

- Adds `preconnect` hints
- Preloads the stylesheet + media swap (`media="print"` → onload set to `all`)
- Ensures `display=swap`
- Provides `<noscript>` fallback

Remove the param to revert to system fonts only.

Self-host recommendation: download stylesheet & woff2 files, place in `static/fonts/`, add `@font-face` rules in `assets/css/fonts.css`, import from `main.css`.

### Predictive Prefetch

Configure likely next pages to prefetch (speeds perceived navigation):

```toml
[params]
prefetch = ["/recommendations/", "/recommendations/courses/"]
```

Output: `<link rel="prefetch" as="document">` for each path (except the current). A small script prefetches nav destinations on first hover/focus if supported. Keep list short (2–4) to avoid waste. Remove or empty to disable.

Future enhancements: home-only static prefetch, upgrade single target to `prerender`.

### Courses hierarchy (bundle-first)

Each course is now a page bundle: `content/recommendations/courses/<slug>/index.md` plus an image file in the same folder. Courses render grouped by an `area` front matter field (Computer Science, Programming, Web Development, Systems, Security, Data, Economics, Finance, Other). Example:

```yaml
---
title: "Introduction to Algorithms"
categories: ["Courses"]
tags: ["course"]
area:
  "Computer Science"
  # Image optional; prefer placing `introToAlgo.png` in the same folder as `index.md` and omit `image:`
summary: "MIT 6.006 lecture series."
```

### Menus

Main navigation is defined in `hugo.toml` under `menu.main`. Edit there to add or reorder items.

### Maintenance tasks

- Run `hugo server -D` during authoring for live preview.
- Use `hugo --gc --minify` for a production build.
- Add new recommendations as page bundles under `content/recommendations/`.
- For Courses, set `area` for correct grouping on the Courses page.

#### Resource Cache Maintenance
To speed up CI builds, this repository commits generated assets in `resources/_gen/`. Over time, or when upgrading the Hugo binary version, this cache may need purging to prevent format incompatibilities and bloat.

To purge and regenerate the cache locally:
```fish
# Clear old cache
hugo --gc
# Delete the tracked resources folder
rm -rf resources/_gen
# Regenerate production assets
npm run build
# Commit the fresh resources
git add resources/_gen && git commit -m "chore: purge and regenerate Hugo resources"
```

## Deploy

Push to `main`. GitHub Actions builds with Hugo and deploys to the `gh-pages` branch via Pages.

CI notes:

- Uses Hugo Extended v0.148.2 in the Actions workflow for consistent image-processing features.
- Publishes a `.nojekyll` file to prevent GitHub Pages from altering output.
- Old URLs are preserved using `aliases` in front matter; keep aliases when renaming/moving content.

### Local production build (fish)

```fish
# install deps and build Tailwind CSS
npm ci
npm run build:css

# production Hugo build
hugo --minify --gc
```

## Generated output

Do not commit build artifacts. Git ignores:

- `public/` (Hugo output)
- `resources/` (Hugo cache/pipeline)

## SEO Enhancements

### Dynamic Meta Descriptions

`head.html` now derives the `<meta name="description">`, Open Graph, and Twitter description using this fallback chain:

1. `params.description` (page front matter)
2. `params.summary`
3. `.Summary` (auto-generated excerpt)
4. `site.Params.description`
5. `site.Title`

Provide a concise `description` in front matter for best control. Leave blank to let Hugo synthesize one.

### Structured Data (JSON-LD)

Added partial: `seo-jsonld.html` (auto-included for pages) emitting a Schema.org graph with:

- `Article` (every page) – `headline`, `description`, `author`/`publisher` as site title, publish/modified dates if present.
- `Course` (pages under `/recommendations/courses/`) – `name`, `description`, `provider`.
- `BreadcrumbList` – Home → section segments → current page.

Extending: add additional types (e.g. `SoftwareApplication`) by updating the partial with conditional detection logic.

### Custom 404 Page

`layouts/404.html` supplies a minimalist not-found page with helpful links (Home, Recommendations, Courses) and `noindex` to keep it out of search results.

### Open Graph Images

OG image selection order:

1. Front matter `image` (absolute or relative)
2. First page bundle image resource
3. Fallback: `/favicon.svg`

### Future SEO Ideas

- Add `lastReviewed` for frequently updated guides.
- Add `SoftwareApplication` schema for tool-specific recommendation pages (fields: name, operatingSystem, applicationCategory, offers).
- Generate XML `news` or `courses` specific feeds if needed.
- Add `sameAs` social profile links via site params.

## Accessibility (A11y)

### Enhanced Focus Styles

Keyboard and assistive tech users benefit from clear focus indicators. The stylesheet adds a consistent `focus-visible` ring (`ring-2` + offset) across links, buttons, form inputs, nav items, and icon buttons. This avoids overriding the default outline for mouse users while offering strong contrast in both light and dark themes.

Skip link (`#main`) receives a distinctive fuchsia ring for fast orientation when tabbing from the top of the page.

### Navigation Landmarks & Current Page

Main and mobile navigation `<nav>` elements include `aria-label`. Active menu links now get `aria-current="page"` for screen reader announcement of the current location.

### Further A11y Ideas

- Add `lang` attribute explicitly via a site param if multilingual variants are added.
- Offer reduced motion preference (respect `prefers-reduced-motion`) for hover/transition-heavy elements.
- Provide high-contrast toggle if expanding beyond current palette.

## Continuous Integration (CI)

- Builds Tailwind CSS and the site, runs Python tests (pytest), and enforces a CSS size budget (current size +15%).
- Runs Lighthouse audits and Axe (axe-core CLI) on key pages.
- Blocking thresholds (owner-selected): Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90. Artifacts are uploaded to `ci/lighthouse/` and `ci/pa11y/`.

### Run audits locally

```fish
# serve production-like site in one terminal
hugo server -D &

# Lighthouse (writes to ci/lighthouse)
npx -y @lhci/cli autorun --config=ci/lighthouserc.json

# Axe (serious/critical only in CI)
npx -y @axe-core/cli http://localhost:1313/
```

## CSP rollout

Goldmark is configured with `unsafe = true` (raw HTML allowed). We mitigate via a meta CSP in report-only mode first:

```
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; report-uri /csp-report-endpoint">
```

To enforce later, progressively remove `'unsafe-inline'` by moving inline scripts/styles to external files and relaxing directives for required external services (fonts, analytics) as needed.

## Images and LCP preloading

- `layouts/partials/responsive-image.html` generates AVIF/WebP with width/height, lazy by default.
- Set `Preload=true` for hero images to emit `<link rel="preload" as="image">` and consider `FetchPriority` = `high`.

## Badges & Versions

Add the CI badge after the workflow is on default branch:

```
![CI](https://github.com/<user>/<repo>/actions/workflows/ci.yml/badge.svg)
```

This project prefers latest stable tool versions (Node LTS, Hugo extended latest, GitHub Actions latest major). CI pins major ranges only.
