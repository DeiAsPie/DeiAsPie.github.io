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
- Add new recommendations as page bundles under `content/recommendations/`.
- For Courses, set `area` for correct grouping on the Courses page.

## Deploy

Push to `main`. GitHub Actions builds with Hugo and deploys to the `gh-pages` branch via Pages.

## Generated output

Do not commit build artifacts. Git ignores:

- `public/` (Hugo output)
- `resources/` (Hugo cache/pipeline)