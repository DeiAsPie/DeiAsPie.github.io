# DeiAsPie - Privacy & Security Recommendations

Curated by DeiAsPie

A minimalist, fast personal site of privacy and security recommendations. Built with Hugo + Tailwind, deployed to GitHub Pages.

The site also lists Economics and Finance courses as secondary content, outside that scope.

## Features

- WebP images with responsive srcsets, lazy loading, speculation-rules prefetching
- Content Security Policy, Subresource Integrity, secure Hugo configuration
- Hugo + Tailwind CSS v4, responsive design, dark mode support
- Playwright E2E, Axe accessibility audits, Lighthouse performance checks

## Local development

Prereqs: [mise](https://mise.jdx.dev), or Hugo Extended 0.162.1 and Node.js 22.

Using mise (recommended):

```fish
# mise installs node, hugo-extended, and python from mise.toml
mise install

# install deps
npm install

# run dev server
hugo server -D
```

Without mise:

```fish
# Ensure node 22 and hugo-extended 0.162.1 are installed separately
npm install
hugo server -D
```

## Content model

Preferred: page bundles with minimal front matter. Create a folder and an `index.md`:

```text
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

- `content/` - Markdown content
  - `content/recommendations/` - All recommendations
  - `content/recommendations/courses/` - Courses hub. Each course is a page with an `area` for grouping
  - `content/about/` - About page
- `layouts/` - Theme templates and partials
- `assets/css/main.css` - Tailwind entry and small component styles
- `static/` - Images and static assets served as-is

### Images

- Preferred: page bundles. Place your image next to `index.md`; omit `image` in front matter to auto-pick the first local image. This keeps content portable and avoids path mismatches.
- Legacy paths under `static/` still work, but new content should colocate images with the page.

Responsive optimization:

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

### Predictive prefetch

Prefetching uses speculation rules only. `assets/speculation-rules.json` is inlined on every page and prefetches same-site links inside `nav` with `moderate` eagerness in browsers that support it. The inline script is covered by a CSP hash, so changing the file changes that hash.

Future enhancement: upgrade a single target to `prerender`.

### Courses hierarchy (bundle-first)

Each course is a page bundle: `content/recommendations/courses/<slug>/index.md` plus an image file in the same folder. Courses render grouped by an `area` front matter field (Computer Science, Programming, Web Development, Systems, Security, Data, Economics, Finance, Other). Example:

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

#### Resource cache maintenance

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

Pushes to `main` run one pipeline in `.github/workflows/ci.yml`. The `verify` job builds the site and runs all checks first. If it passes, the `publish` job deploys that same verified build to GitHub Pages with the Pages deploy action.

CI notes:

- Uses Hugo Extended 0.162.1 (pinned in mise.toml) for consistent image-processing features.
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

## SEO

### Dynamic meta descriptions

`head.html` derives the `<meta name="description">` and Open Graph description using this fallback chain:

1. `params.description` (page front matter)
2. `params.summary`
3. `.Summary` (auto-generated excerpt)
4. `site.Params.description`
5. `site.Title`

Provide a concise `description` in front matter for best control. Leave blank to let Hugo synthesize one.

### Structured data (JSON-LD)

The `seo-jsonld.html` partial (auto-included for pages) emits a Schema.org graph with:

- `Article` (single content pages): `headline`, `description`, `author`/`publisher` as site title, publish/modified dates if present.
- `Course` (pages under `/recommendations/courses/`): `name`, `description`, `provider`.
- `BreadcrumbList`: Home → section segments → current page.

Extending: add additional types (e.g. `SoftwareApplication`) by updating the partial with conditional detection logic.

### Custom 404 page

`layouts/404.html` supplies a minimalist not-found page with helpful links (Home, Recommendations, Courses).

### Open Graph images

OG image selection order:

1. Front matter `image` (absolute or relative)
2. First page bundle image resource
3. Fallback: `/favicon.svg`

### Future SEO ideas

- Add `lastReviewed` for frequently updated guides.
- Add `SoftwareApplication` schema for tool-specific recommendation pages (fields: name, operatingSystem, applicationCategory, offers).
- Generate XML `news` or `courses` specific feeds if needed.
- Add `sameAs` social profile links via site params.

## Accessibility (A11y)

### Focus styles

Keyboard and assistive tech users benefit from clear focus indicators. The stylesheet adds a consistent `focus-visible` ring (`ring-2` + offset) across links, buttons, form inputs, nav items, and icon buttons. This avoids overriding the default outline for mouse users while offering strong contrast in both light and dark themes.

Skip link (`#main`) receives a distinctive fuchsia ring for fast orientation when tabbing from the top of the page.

### Navigation landmarks and current page

Main and mobile navigation `<nav>` elements include `aria-label`. Active menu links get `aria-current="page"` for screen reader announcement of the current location.

### Further a11y ideas

- Add `lang` attribute explicitly via a site param if multilingual variants are added.
- Offer reduced motion preference (respect `prefers-reduced-motion`) for hover/transition-heavy elements.
- Provide high-contrast toggle if expanding beyond current palette.

## Verification: what runs where

Verification runs both locally and in CI before deployment. In CI, the fast checks in the `verify` job gate publishing. The browser smoke tests and the Lighthouse and axe audit run alongside in the `browser-audit` job and do not block publishing.

### Before every push (`.husky/pre-push`)

Lighthouse and Axe run against a local production build of the site via `scripts/audit.sh`. The hook blocks the push if either fails, and has no bypass.

Blocking thresholds: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90, set in `ci/lighthouserc.json`. Axe fails on serious or critical violations only. Reports land in `ci/lighthouse/` and `ci/axe/`, both gitignored.

To run them without pushing:

```bash
sh .husky/pre-push
```

### On every push and pull request (`.github/workflows/ci.yml`)

Triggers: every push, pull requests, and manual runs. Three jobs:

**Gating (`verify`):** production build, CSS size budget (against the committed `css-baseline-kib.txt`), per-bundle image budgets, content lint, markdown lint, Biome, and pytest. On a push or manual run on `main`, it also uploads the Pages artifact. `publish` waits for it.

**Non-blocking (`browser-audit`):** the Playwright smoke tests (Chromium only) and the Lighthouse and axe audits (`scripts/audit.sh`). It runs alongside `verify` and does not gate `publish`. A failure here still marks the workflow run as failed.

**Publish (`publish`):** runs only on a push or manual run on `main`, after `verify` passes. It deploys the artifact that `verify` uploaded, so the published site is the build that passed the checks. Pull requests never publish.

CI passes `--no-sandbox` to Chromium so the accessibility and performance checks run in the runner environment.

## Content Security Policy

Goldmark is configured with `unsafe = false` for improved security; raw HTML in markdown is disallowed and shortcodes are used instead when custom markup is required. A meta CSP limits sources to `'self'` (images also allow `https:`), and allows the two inline scripts by SHA-256 hash instead of `'unsafe-inline'`.

## Images and LCP preloading

- `layouts/partials/responsive-image.html` generates responsive WebP images with width/height, lazy by default.
- Set `Preload=true` for hero images to emit `<link rel="preload" as="image">` and consider `FetchPriority` = `high`.

## Badges and versions

Add the CI badge after the workflow is on default branch:

```markdown
![CI](https://github.com/<user>/<repo>/actions/workflows/ci.yml/badge.svg)
```

This project prefers latest stable tool versions (Node LTS, Hugo extended latest, GitHub Actions latest major). CI pins major ranges only.
