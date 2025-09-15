#!/bin/sh
# Startup wrapper for admin-backend: find a JS entrypoint produced by tsc and run it,
# fallback to `npm run start` if none found.

set -e

BASEDIR=/srv/admin-backend

try_node() {
  echo "Trying to exec: node $1" >&2
  exec node "$1"
}

# Candidate paths in order of preference
CANDIDATES="\
$BASEDIR/dist/app.js \
$BASEDIR/dist/simple-app.js \
$BASEDIR/dist/admin-backend/src/app.js \
$BASEDIR/dist/admin-backend/src/simple-app.js \
"

for p in $CANDIDATES; do
  if [ -f "$p" ]; then
    try_node "$p"
    exit 0
  fi
done

echo "No compiled entry found; falling back to 'npm run start'" >&2
cd "$BASEDIR"
exec npm run start --prefix "$BASEDIR"
