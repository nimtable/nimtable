#!/usr/bin/env bash

set -e

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

cd "$SCRIPT_DIR"/../../backend || exit 1
./gradlew build

# Copy the jar to the dev directory, since it's in .dockerignore
cp ./build/libs/nimtable-all.jar "$SCRIPT_DIR"/nimtable-all.jar

# Build the frontend
cd "$SCRIPT_DIR"/../.. || exit 1
npm run build

# Copy the build directory to the dev directory
cp -r .next "$SCRIPT_DIR"/.next
cp package.json "$SCRIPT_DIR"/package.json
cp package-lock.json "$SCRIPT_DIR"/package-lock.json
