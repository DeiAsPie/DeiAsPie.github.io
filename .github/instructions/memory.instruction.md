---
applyTo: "**"
---

# User Preferences

- CI should block PRs immediately on Lighthouse categories >= 90 (Performance, Accessibility, SEO, Best Practices).

# Project Context

- Hugo + Tailwind v4 site. Tailwind entry: assets/css/main.css -> assets/gen/tailwind.css.
- Theme: curated; site overrides allowed under layouts/partials/.
- Tests ban certain template literals; we also forbid inline event handlers in templates.

# Coding Patterns

- Prefer Hugo Pipes and image processing in partials. Keep lazy loading by default; allow Preload param for LCP only.

# Context Research History

- CSP rollout will start in report-only via meta tag while unsafe=true remains in Goldmark renderer.

# Conversation History

- Owner selected blocking mode for Lighthouse CI.

# Notes

- When adding audits, upload artifacts to ci/lighthouse and ci/pa11y.
