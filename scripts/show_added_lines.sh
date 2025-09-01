#!/usr/bin/env bash
set -euo pipefail

# Print only the added lines from the staged diff for HTML/HTM files.
git --no-pager diff --cached -U0 -- '*.html' '*.htm' || true | sed -n 's/^+//p' | sed -n '1,500p'

# Also show which added lines match the exact forbidden literals (for quick diagnosis)
echo
echo '--- Matches for href pattern (literal) ---'
git --no-pager diff --cached -U0 -- '*.html' '*.htm' || true | awk '/^\+\+\+ b\//{file=substr($0,6)} /^\+/{if(!/^\+\+\+/{line=substr($0,2); if(index(line, "href=\"{{ \" /")!=0) print file ": " line}}' || true
echo
echo '--- Matches for delimiter literal " , " ---'
git --no-pager diff --cached -U0 -- '*.html' '*.htm' || true | awk '/^\+\+\+ b\//{file=substr($0,6)} /^\+/{if(!/^\+\+\+/{line=substr($0,2); if(index(line, "\" , \"")!=0) print file ": " line}}' || true
