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

## AI Coding Guidelines — concise

This Hugo-based static site (theme: `themes/curated/`) curates privacy/security recommendations. Keep edits minimal and follow existing content patterns and page-bundle structure.

- Architecture highlights:
  - Content = page bundles under `content/recommendations/` (e.g. `content/recommendations/tool/index.md` + images). Prefer bundles over single `.md` files.
  - Tailwind v4 pipeline: source `assets/css/main.css` -> generated `assets/gen/tailwind.css` (built via `npm run build:css`).
  - Hugo config: see `hugo.toml` (Goldmark `unsafe = true`, pagination `pagerSize = 12`, taxonomies `categories`/`tags`).

- Key developer workflows (explicit commands):
  - Start dev server (drafts): `npm run dev` (runs `hugo server -D`).
  - Build CSS: `npm run build:css` (required before local Hugo builds in many cases).
  - Full prod build: `npm run build:prod` (runs CSS build then `hugo --minify --gc`).
  - Run tests: `npm test` (executes `pytest -q` against `tests/`).
  - Run Axe accessibility scan: `npm run axe` (expects a local server; see `scripts/run_axe.mjs`).

- Project conventions (do not change without coordinating):
  - Use page bundles for any new recommendation or course page. Example: add `content/recommendations/my-tool/index.md` plus assets in the same folder.
  - Omit `image` front matter to let the site auto-detect the first image in the bundle.
  - Omit `summary` to auto-extract the first sentence.
  - Course pages must include `area` front matter for grouping (e.g. `area: "Computer Science"`).
  - Prefer Tailwind utilities over raw CSS; use `assets/css/main.css` only for component classes.

- Template safety & tests:
  - `tests/test_forbidden_templates.py` enforces forbidden patterns (inline event handlers, unsafe URL formatting). Follow its patterns when editing templates in `layouts/` or `themes/curated/`.

- Useful file references (examples):
  - Project config: `hugo.toml` (pagination, goldmark settings).
  - Tailwind entry: `assets/css/main.css` and generated `assets/gen/tailwind.css`.
  - Build/test scripts: `package.json` (scripts: `dev`, `build:css`, `build:prod`, `test`, `axe`).
  - CI and audits: `ci/` (Lighthouse/axe configs) and `scripts/` (audit helpers).

- Small, safe PR guidance:
  - Run `npm run build:css` and `npm run dev` to smoke-test changes.
  - Run `npm test` before opening a PR.
  - Avoid changing global templates or `hugo.toml` without discussion; these affect CI and site behavior.

If anything here is unclear or you want expansion (examples, tests, CI rules), tell me which section to expand and I'll iterate.
summary: "Brief description" # Optional: auto-extracted if omitted
