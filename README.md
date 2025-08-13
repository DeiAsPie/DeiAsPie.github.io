# Yet Another Educational Resource

Curated by DeiAsPie

A minimalist, fast personal site for sharing recommendations for tools, services, and courses. Built with Hugo + Tailwind, deployed to GitHub Pages.

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

## Deploy

Push to `main`. GitHub Actions builds with Hugo and deploys to the `gh-pages` branch via Pages.