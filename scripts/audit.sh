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

LH_URLS="$URLS" node scripts/run_lighthouse.mjs
AXE_URLS="$URLS" node scripts/run_axe.mjs
