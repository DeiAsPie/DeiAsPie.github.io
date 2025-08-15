# Yet Another Educational Resource

Curated by DeiAsPie

A minimalist, fast personal site for sharing recommendations for tools, services, and courses. Built with Hugo + Tailwind, deployed to GitHub Pages.

Dark mode is the default. Use the Theme toggle in the header to switch; your choice is remembered in localStorage.

## Local development

Prereqs: Hugo Extended and Node.js 20+

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

### Courses hierarchy (bundle-first)

Each course is now a page bundle: `content/recommendations/courses/<slug>/index.md` plus an image file in the same folder. Courses render grouped by an `area` front matter field (Computer Science, Programming, Web Development, Systems, Security, Data, Economics, Finance, Other). Example:

```yaml
---
title: "Introduction to Algorithms"
categories: ["Courses"]
tags: ["course"]
area: "Computer Science"
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