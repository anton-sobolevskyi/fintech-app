#!/bin/sh
set -e

if [ ! -x node_modules/.bin/ng ]; then
  echo "Installing app dependencies..."
  npm ci
fi

if [ ! -d functions/node_modules/firebase-functions ]; then
  echo "Installing Firebase Functions dependencies..."
  npm ci --prefix functions
fi

npm run prestart

exec npx ng serve --host 0.0.0.0 --port 4200 --poll 2000
