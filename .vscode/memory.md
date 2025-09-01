---
applyTo: '**'
---

- preference: Prevent reintroduction of template tokens that produce spaced path like `href="{{ " /" | relURL }}` or malformed delimiters like `" , "`.
- note: Use pre-commit hook that checks added lines only for forbidden literals.  
