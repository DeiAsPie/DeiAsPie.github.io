\*\*AGENTS guidelines for DeiAsPie.github.io

- **Build**: `npm run build` (Hugo); `npm run build:prod` for production (builds CSS + Hugo minify).
- **Dev server**: `npm run dev` or `hugo server -D` (serves drafts).
- **CSS**: `npm run build:css` (Tailwind CLI outputs `assets/gen/tailwind.css`).
- **Format**: `npm run format` (Prettier).
- **Tests**: `npm test` runs `pytest -q` (tests/). To run a single test file: `pytest -q tests/test_forbidden_templates.py` or a single test by node: `pytest -q tests/test_forbidden_templates.py::TestForbiddenTemplatePatterns::test_no_forbidden_literals_in_templates`.
- **Lint/A11y/Perf**: `npx -y @lhci/cli autorun --config=ci/lighthouserc.json` (Lighthouse), `npx -y @axe-core/cli http://localhost:1313/` (Axe).

- **Imports & languages**: Keep Hugo templates minimal; JS in `assets/js/` and `static/` where needed. Python tests live in `tests/` and use `unittest`/`pytest`.
- **Formatting**: Use `prettier` for templates/JS/CSS; keep lines ≲ 100 chars; Tailwind-first CSS in `assets/css/main.css`.
- **Types & annotations**: Use Python type hints where helpful. Keep functions small and pure when possible.
- **Naming**: Clear, descriptive names: `content/recommendations/<slug>/index.md` for bundles; CSS classes follow Tailwind utilities; partials under `layouts/partials/` named for reuse.
- **Error handling**: Catch and log file/IO errors in scripts; tests may skip unreadable files (see `tests/test_forbidden_templates.py`).
- **Security rules (Copilot rules included)**: Avoid inline event handlers (`onclick=`, `onload=`, `onerror=`), unsafe printf/url patterns; follow `.github/copilot-instructions.md` forbidden patterns and tests.
- **Cursor/Copilot rules**: Include `.github/copilot-instructions.md` guidance: run `npm run build:css` before Hugo, prefer page bundles, and enforce template security patterns.
- **Commit & CI**: Do not commit generated assets (`public/`, `resources/`, `assets/gen/`). CI runs Tailwind + Hugo + tests + audits; keep changes small and test locally before pushing.

(Keep this file short — agents should follow project README and `.github/copilot-instructions.md` for more context.)
