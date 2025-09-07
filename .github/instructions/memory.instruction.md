---
applyTo: "**"
---

# User Preferences

- CI should block PRs immediately on Lighthouse categories >= 90 (Performance, Accessibility, SEO, Best Practices).
- Keep production stable with small, targeted changes and clear rollback paths.
- Prefer latest stable tooling and pin through lockfiles.

# Project Context

- Hugo + Tailwind v4 site. Tailwind entry: assets/css/main.css -> assets/gen/tailwind.css.
- Theme: curated; site overrides allowed under layouts/partials/.
- Tests ban certain template literals; we also forbid inline event handlers in templates.
- GitHub Actions used for CI (build/test/audits), Pages deployment, and CodeQL.
- Python-based tests run with pytest; Node 22.x used for build tooling.

# Coding Patterns

- Prefer Hugo Pipes and image processing in partials. Keep lazy loading by default; allow Preload param for LCP only.
- Use Playwright for browser tasks in CI to avoid driver/version drift.
- Avoid multi-process env juggling; compute values deterministically in a single language (Node) and pass via $GITHUB_OUTPUT.
- Use Node scripts for small CI computations (CSS size, budgets) instead of shell arithmetic for cross-shell reliability.
- Normalize attribute quoting for Hugo/Prettier harmony; run Prettier with prettier-plugin-go-template.
- Keep generated artifacts (e.g., assets/gen/tailwind.css) out of source control; ensure .gitignore and repo state align.

# Context Research History

- CSP rollout will start in report-only via meta tag while unsafe=true remains in Goldmark renderer.
- Lighthouse CI: prefer Playwright-installed Chromium; set chromePath via env and config to ensure headless stability.
- Axe: Selenium/ChromeDriver is brittle on hosted runners due to version skew; Playwright + axe-core injection is robust.
- GitHub Actions ubuntu-24.04 runners may ship Chrome not matching ChromeDriver; avoid relying on system Chrome.
- fish shell differs from bash for assignments; avoid assuming bash syntax in docs and scripts when run locally.

# Conversation History

- Owner selected blocking mode for Lighthouse CI.
- CI pipeline updated to compute CSS budget (current KiB × 1.15) in one Node step and enforce via script.
- Axe audits migrated to Playwright to fix ChromeDriver mismatch failures; serious/critical only enforced.
- Setup-node/setup-python/checkout actions at v5; Hugo via peaceiris/actions-hugo@v3 pinned to latest (0.149.1 at time).
- Prettier upgraded to 3.6.2; Tailwind v4 stack at 4.1.13; postcss 8.5.6.
- Verified local gates: Tailwind build OK; pytest OK; Axe on key pages OK; Prettier OK.

# Notes

- When adding audits, upload artifacts to ci/lighthouse and ci/axe.
- CSS budget enforcement:
  - Compute size and budget in a single Node process and export via GITHUB_OUTPUT to avoid NaN/env parsing issues.
  - scripts/check_css_size.js reads CSS_BUDGET_KIB; printing via --print/--bytes aids diagnostics.
- Axe via Playwright:
  - Install Playwright Chromium in CI before running audits.
  - Inject axe-core (prefer axe-core/axe.min.js; fallback to inline source) and evaluate axe.run.
  - Fail only on serious/critical impact to reduce noise.
- Lighthouse:
  - Detect or install Chromium via Playwright; set CHROME*PATH/LHCI*\* envs; write a temp config with chromePath and headless=new.
- Repo hygiene:
  - Untrack generated CSS; ensure .gitignore covers assets/gen/\*.css.
  - Keep package-lock.json committed; use npm ci in CI.
