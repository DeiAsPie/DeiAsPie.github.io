---
applyTo: '\*\*'
---

# Assets workflow

- Canonical client-side JS and other assets that should be processed by Hugo Pipelines live in `assets/`.
- Use `resources.Get` in templates to access and process these files (minify, fingerprint):

```go
{{ $script := resources.Get "js/init-ui.js" | minify | fingerprint }}
<script src="{{ $script.RelPermalink }}" integrity="{{ $script.Data.Integrity }}" defer></script>
```

- Files placed in `static/` are copied verbatim to the final site and are not processed by Hugo Pipes. Avoid keeping duplicates across `assets/` and `static/` to prevent drift.
- Tailwind scanning should include source locations where your JS/CSS are authored. This repo uses `assets/js` as the source for dynamic class scanning.

If you prefer the old behavior (unprocessed static assets), move files to `static/` and update templates to reference them using `relURL`.
