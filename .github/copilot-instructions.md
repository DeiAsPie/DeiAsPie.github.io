# AI Coding Guidelines for DeiAsPie.github.io

## Architecture Overview

This is a Hugo static site generator project focused on privacy/security tool recommendations. Key architectural patterns:

- **Page Bundles**: Content organized as folders (`content/recommendations/tool/index.md` + assets). Preferred over single markdown files.
- **Auto-Image Detection**: Omit `image` front matter to auto-use first image in bundle folder
- **Auto-Summary**: Omit `summary` to extract from content's first sentence
- **Courses Grouping**: Use `area` field for course categorization (Computer Science, Programming, etc.)
- **Dark Mode Default**: Theme persistence via localStorage, defaults to dark

## Build & Development Workflow

### Essential Commands

```bash
# Development server (includes drafts)
hugo server -D

# Build Tailwind CSS (required before Hugo build)
npm run build:css

# Production build (CSS + Hugo with minification)
npm run build:prod

# Run tests
npm test  # Runs pytest on tests/
```

### CSS Pipeline

- **Tailwind v4**: Uses `@tailwindcss/cli` with custom config
- **Output**: `assets/gen/tailwind.css` (gitignored)
- **Size Budget**: Enforced via `scripts/check_css_size.js`
- **Content Scanning**: Configured for `content/`, `layouts/`, `themes/`

### Testing & Quality

- **Python Tests**: `pytest` on `tests/` directory
- **Accessibility**: Axe-core CLI audits via `scripts/run_axe.mjs`
- **Performance**: Lighthouse CI with 90+ score requirements
- **Template Security**: `tests/test_forbidden_templates.py` prevents unsafe patterns

## Content Model Patterns

### Recommendations

```yaml
---
title: "Tool Name"
link: "https://example.com"
categories: ["Category"]
tags: ["tag1", "tag2"]
summary: "Brief description" # Optional: auto-extracted if omitted
---
Content here...
```

### Courses

```yaml
---
title: "Course Name"
categories: ["Courses"]
tags: ["course"]
area: "Computer Science" # Required for grouping
---
Course description...
```

## Hugo Configuration Patterns

### Key Settings (`hugo.toml`)

- `unsafe = true` in Goldmark renderer (raw HTML allowed)
- CSP in report-only mode during rollout
- Taxonomy: `categories` and `tags`
- Pagination: 12 items per page
- Minification enabled

### Template Structure

- **Theme**: `themes/curated/` (custom layouts)
- **Partials**: `layouts/partials/` for reusable components
- **Responsive Images**: `responsive-image.html` partial handles WebP generation
- **SEO**: Dynamic meta descriptions, JSON-LD structured data

## Deployment & CI

### GitHub Actions

- Builds with Hugo Extended v0.148.2
- Deploys to `gh-pages` branch
- Runs Lighthouse, Axe, and CSS size checks
- Blocking thresholds: Performance/Accessibility/SEO/Best Practices ≥90

### Local Audit Commands

```bash
# Lighthouse audit (requires running server)
npx @lhci/cli autorun --config=ci/lighthouserc.json

# Axe accessibility scan
npx @axe-core/cli http://localhost:1313/
```

## Security & Performance

### CSP Strategy

Currently report-only mode. Planned progression:

1. Move inline scripts/styles to external files
2. Remove `'unsafe-inline'` allowances
3. Relax directives for required external services

### Image Optimization

- **Responsive Images**: Auto-generates multiple widths (WebP + original)
- **Lazy Loading**: Default behavior
- **Preloading**: Set `Preload=true` for hero images

### PWA Features

- Service worker in `static/sw.js`
- Web app manifest in `static/manifest.json`
- Pagefind search integration

## Code Quality Standards

### Template Security

Forbidden patterns (enforced by tests):

- `href="{{ " /` (unsafe URL construction)
- `printf " /%s"` (unsafe string formatting)
- `onclick=`, `onload=`, `onerror=` (inline event handlers)

### CSS Organization

- **Tailwind First**: Use utility classes over custom CSS
- **Component Classes**: Define in `assets/css/main.css` when needed
- **Dark Mode**: Use `dark:` prefix for theme variants

### Content Guidelines

- **Privacy-Focused**: All recommendations emphasize user sovereignty
- **Platform Priorities**: Mobile-first security approach
- **Critical Rules**: Social media avoidance, strong passwords, encryption

## File Structure Reference

```
content/
├── _index.md                 # Homepage
├── about/                    # About section
├── recommendations/          # Main content
│   ├── _index.md            # Recommendations index
│   ├── tool/                # Page bundle example
│   │   ├── index.md
│   │   └── logo.png
│   └── courses/             # Course recommendations
│       └── course-slug/
│           ├── index.md
│           └── image.png

layouts/partials/             # Reusable components
assets/css/main.css          # Tailwind entry + custom styles
themes/curated/              # Custom Hugo theme
scripts/                     # Build/test utilities
ci/                          # Audit configurations
```

## Common Gotchas

- **Always run `npm run build:css`** before Hugo builds
- **Use page bundles** for new recommendations (not single .md files)
- **Omit `image` field** to auto-detect bundle images
- **Test with `hugo server -D`** to see draft content
- **Check CSS size budget** after style changes
- **Run audits locally** before pushing changes</content>
  <parameter name="filePath">/home/user/Downloads/personal/DeiAsPie.github.io/.github/copilot-instructions.md
