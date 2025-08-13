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

## Content model

Add markdown files under `content/recommendations/` using this front matter:

```yaml
---
title: "Name of the Tool or Service"
date: YYYY-MM-DD
draft: false
categories: ["Category A", "Category B"]
tags: ["tag-a", "tag-b", "tag-c"]
link: "https://example.com/"
image: "/images/tool-logo.png"
summary: "A concise one-sentence summary for display on list pages."
---

Full recommendation text in Markdown...
```

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

- Recommended (new): use page bundles. Place your image next to `index.md`; omit `image` in front matter to auto-pick. This keeps content portable.
- Legacy: images under `static/images/` (tools) and `static/courses/images/posts/` (courses) still work; reference with absolute paths like `/images/tool.png` or `/courses/images/posts/ml.png`.

### Courses hierarchy

Courses render grouped by an `area` front matter field (Computer Science, Programming, Web Development, Systems, Security, Data, Economics, Finance, Other). Example:

```yaml
---
title: "Introduction to Algorithms"
categories: ["Courses"]
tags: ["course"]
area: "Computer Science"
image: "/courses/images/posts/introToAlgo.png"
summary: "MIT 6.006 lecture series."
---
```

### Menus

Main navigation is defined in `hugo.toml` under `menu.main`. Edit there to add or reorder items.

### Maintenance tasks

- Run `hugo server -D` during authoring for live preview.
- Use `hugo --gc --minify` for a production build.
- Add new recommendations under `content/recommendations/` and keep `summary` concise.
- For Courses, set `area` for correct grouping on the Courses page.

## Deploy

Push to `main`. GitHub Actions builds with Hugo and deploys to the `gh-pages` branch via Pages.

## Single-file authoring (easier adds)

You can create a recommendation as a page bundle with a single `index.md` and an image next to it. If `image` isn’t set in front matter, the first image in the bundle is used automatically. If `summary` isn’t provided, the card falls back to the first sentence of the content.

Example structure:

```
content/recommendations/my-tool/
	index.md
	logo.png
```

Minimal front matter:

```yaml
---
title: "My Tool"
link: "https://example.com"
---
```

Then write your Markdown content below. The listing card will pick up the summary from the first sentence automatically if you omit `summary`.