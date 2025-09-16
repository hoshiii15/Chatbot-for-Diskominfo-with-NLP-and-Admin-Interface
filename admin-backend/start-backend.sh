#!/bin/sh
# Startup wrapper for admin-backend: find a JS entrypoint produced by tsc and run it,
# fallback to `npm run start` if none found.
set -e

# Updated BASEDIR to match your actual path
BASEDIR=/home/sukokab/Chatbot-for-Diskominfo-with-NLP-and-Admin-Interface/admin-backend

try_node() {
  echo "Trying to exec: node $1" >&2
  exec node "$1"
}

# Candidate paths in order of preference
CANDIDATES="\
$BASEDIR/dist/admin-backend/src/app.js \
$BASEDIR/dist/admin-backend/src/simple-app.js \
$BASEDIR/dist/app.js \
$BASEDIR/dist/simple-app.js \
"

echo "Looking for compiled entry points in: $BASEDIR" >&2
for p in $CANDIDATES; do
  echo "Checking: $p" >&2
  if [ -f "$p" ]; then
    echo "Found entry point: $p" >&2
    try_node "$p"
    exit 0
  fi
done

echo "No compiled entry found; falling back to 'npm run start'" >&2
cd "$BASEDIR"
exec npm run start --prefix "$BASEDIR"
