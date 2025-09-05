---
applyTo: '**'
---

# Project Memory: DeiAsPie.github.io

## Project Overview
- **Type**: Hugo static site generator with Tailwind CSS
- **Purpose**: Privacy-focused tool and service recommendations site
- **Domain**: https://deiaspie.github.io/
- **Theme**: Custom "curated" theme
- **Focus**: Digital privacy, security, and escaping surveillance capitalism

## Technical Stack
- **Static Site Generator**: Hugo Extended v0.149.0
- **CSS Framework**: Tailwind CSS v4.1.12
- **Node.js**: v22 (for build tools)
- **Deployment**: GitHub Pages via GitHub Actions
- **Package Manager**: npm

## Project Structure
```
DeiAsPie.github.io/
├── .github/workflows/     # CI/CD automation
├── assets/               # CSS and build assets
├── content/              # Markdown content
│   ├── recommendations/  # Main content (tools/services)
│   │   └── courses/      # Educational courses
│   └── about/           # About page
├── layouts/             # Theme templates
├── static/              # Static assets (images, etc.)
├── themes/curated/      # Custom theme
├── hugo.toml           # Hugo configuration
├── package.json        # Node.js dependencies
├── tailwind.config.js  # Tailwind configuration
└── postcss.config.js   # PostCSS configuration
```

## Key Features
1. **Content Model**: Page bundles with minimal front matter
2. **Image Optimization**: Responsive images with WebP conversion
3. **SEO**: JSON-LD structured data, Open Graph, meta descriptions
4. **Accessibility**: Focus styles, ARIA landmarks, semantic HTML
5. **Performance**: Tailwind CSS, Hugo's fast builds, prefetch hints
6. **Dark Mode**: Default with localStorage persistence

## Content Categories
- Privacy tools (browsers, VPNs, email, messaging)
- Security applications (password managers, authentication)
- Open source alternatives (office suites, operating systems)
- Educational courses (economics, programming, startup)
- Digital sovereignty resources

## Build & Deployment Process
1. **Local Development**: `hugo server -D`
2. **CSS Build**: `npm run build:css` (Tailwind compilation)
3. **Production Build**: `hugo --minify --gc`
4. **CI/CD**: GitHub Actions on push to main
   - Runs Python unit tests
   - Builds Tailwind CSS
   - Generates Hugo site
   - Deploys to GitHub Pages

## Key Configuration
- **Base URL**: https://deiaspie.github.io/
- **Title**: "DeiAsPie - Privacy & Security Recommendations"
- **Theme**: curated (custom)
- **Markup**: Goldmark with unsafe HTML enabled
- **Prefetch**: /recommendations/, /recommendations/courses/

## Content Guidelines
- Use page bundles (folder + index.md + images)
- Minimal front matter (title, link required)
- Auto-generated summaries from first sentence
- Colocated images for portability
- Tags and categories for organization

## Navigation Structure
1. Home (/)
2. All Recommendations (/recommendations/)
3. Courses (/recommendations/courses/)
4. Categories (/categories/)
5. Tags (/tags/)
6. About (/about/)

## User Persona: DeiAsPie
- Privacy advocate and educator
- Creates content about digital sovereignty
- Active on LBRY/Odysee platform
- GitHub contributor
- Focuses on practical privacy solutions for all skill levels

## Development Notes
- Hugo Extended required for image processing
- Tailwind CSS v4+ with CLI compilation
- Custom theme with responsive design
- SEO-optimized with structured data
- Accessibility-first approach
- No Jekyll processing (.nojekyll file)
- preference: Prevent reintroduction of template tokens that produce spaced path like `href="{{ " /" | relURL }}` or malformed delimiters like `" , "`.
- note: Use pre-commit hook that checks added lines only for forbidden literals.
- Prefer latest stable versions of all tools, software, and dependencies.
