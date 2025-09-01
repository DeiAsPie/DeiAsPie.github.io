#!/usr/bin/env python3
"""
Print staged added lines (file:path and content) and search for forbidden literals.
Run from repo root. Exits 0.
"""

import subprocess

p = subprocess.run(
    ["git", "diff", "--cached", "-U0", "--", "*.html", "*.htm"],
    capture_output=True,
    text=True,
)
d = p.stdout
lines = d.splitlines()
file = None
added = []
for l in lines:
    if l.startswith("+++ b/"):
        file = l[6:]
        continue
    if l.startswith("diff --git"):
        # reset
        file = None
        continue
    if file and l.startswith("+") and not l.startswith("+++"):
        content = l[1:]
        added.append((file, content))

print("--- Added lines (file: content) ---")
for i, (f, c) in enumerate(added, 1):
    print(f"{i}: {f}: {c}")

patterns = ['href="{{ " /', 'printf " /%s"', '" , "']
print("\n--- Matches ---")
for p in patterns:
    print(f"\nPattern: [{p}]")
    found = False
    for i, (f, c) in enumerate(added, 1):
        if p in c:
            print(f"{i}: {f}: {c}")
            found = True
    if not found:
        print("(no matches)")
