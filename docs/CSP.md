# Content Security Policy (CSP) reporting and this site

Why we removed `report-uri` from the meta CSP

Modern browsers ignore `report-uri` when a Content-Security-Policy is delivered via a `<meta>` element and will log a console error like:

> The Content Security Policy directive 'report-uri' is ignored when delivered via a <meta> element.

Because Git-based hosts such as GitHub Pages don't allow setting arbitrary HTTP response headers, a meta CSP is sometimes used to provide the non-reporting enforcement directives. However, reporting belongs in HTTP response headers (Report-To / report-to + Content-Security-Policy-Report-Only) or via a hosting layer that lets you add headers.

What we changed in this repository

- Removed `report-uri` from the meta-delivered CSP in `layouts/partials/head.html` to stop browsers emitting the console error.
- Added an explicit font-size rule for headings inside semantic sectioning elements in `assets/css/main.css` so Lighthouse won't flag deprecated implicit UA defaults.

How to enable header-based reporting (recommended for production)

1. Use a host or CDN that supports custom response headers (Netlify, Cloudflare Pages, AWS, or a proxy like Cloudflare Workers). GitHub Pages cannot set these headers.

2. Example headers (set these on the edge/host):

```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' https://www.googletagmanager.com; img-src 'self' data: https:; object-src 'none'; report-to "csp-endpoint";

Report-To: {"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"https://example.com/csp-reports"}]}
```

3. Rollout plan:

- Start with `Content-Security-Policy-Report-Only` and the `Report-To` header for 1–2 weeks.
- Monitor collected reports and fix any unintended blocking.
- Once confident, switch to `Content-Security-Policy` (enforced) and keep `Report-To` if desired.

If you cannot set headers

- Keep a meta-delivered CSP for the protective directives (script/style/img/font allowances) but do not include `report-uri` in the meta CSP. Reporting via meta is unreliable and will trigger console errors.

Notes

- This repository's meta CSP remains useful for auditing and documentation. For production reporting, move to header-configurable hosting or a proxy that injects the required reporting headers.
