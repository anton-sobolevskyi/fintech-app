#!/bin/sh
set -e

if [ ! -d functions/node_modules/firebase-functions ]; then
  echo "Installing Cloud Functions dependencies..."
  npm ci --prefix functions
fi

echo "Building Cloud Functions..."
npm run build --prefix functions

IMPORT_ARGS=""
if [ -d emulator-data ] && [ "$(ls -A emulator-data 2>/dev/null || true)" ]; then
  IMPORT_ARGS="--import=./emulator-data"
fi

exec firebase emulators:start \
  --project "${FIREBASE_PROJECT:-fintech-app-3aacb}" \
  --only auth,functions,firestore,storage,ui \
  ${IMPORT_ARGS} \
  --export-on-exit=./emulator-data
