#!/bin/sh
# Serves the built site and runs the Lighthouse and axe audits against it.
#
# Called by both .husky/pre-push and the CI workflow so that "audit the site"
# has a single definition: one server lifecycle, one URL list, one pair of
# thresholds. Requires public/ to already exist (run the Hugo build first).

set -e

PORT=8080

npx http-server public -p "$PORT" --silent &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 20); do
  if curl -sSf "http://localhost:$PORT" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -sSf "http://localhost:$PORT" >/dev/null 2>&1; then
  echo "audit: static server did not come up on port $PORT" >&2
  exit 1
fi

BASE="http://localhost:$PORT"
URLS="$BASE/,$BASE/about/,$BASE/recommendations/"

# Rotational sampling of 3-5 leaf recommendation pages
SAMPLED_URLS=$(python3 -c '
import glob, os, random, sys
base_url = sys.argv[1]
rec_dir = "public/recommendations"
files = glob.glob(os.path.join(rec_dir, "**", "index.html"), recursive=True)
excluded = {
    os.path.normpath(os.path.join(rec_dir, "index.html")),
    os.path.normpath(os.path.join(rec_dir, "courses", "index.html")),
}
leaf_paths = []
for p in files:
    norm = os.path.normpath(p)
    if norm in excluded or "/page/" in norm:
        continue
    try:
        with open(p, "r", encoding="utf-8", errors="ignore") as f:
            head = f.read(500)
            if "http-equiv=refresh" in head or "http-equiv=\"refresh\"" in head:
                continue
    except Exception:
        continue
    leaf_paths.append(p)

if leaf_paths:
    k = min(len(leaf_paths), random.randint(3, 5))
    selected = random.sample(leaf_paths, k)
    clean_base = base_url.rstrip("/")
    urls = [clean_base + "/" + os.path.relpath(os.path.dirname(p), "public").strip("/") + "/" for p in selected]
    print(",".join(urls))
' "$BASE")

if [ -n "$SAMPLED_URLS" ]; then
  URLS="$URLS,$SAMPLED_URLS"
fi

echo "audit: target URLs: $URLS"

LH_URLS="$URLS" node scripts/run_lighthouse.mjs
AXE_URLS="$URLS" node scripts/run_axe.mjs
