#!/bin/bash

set -e

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

cd "$SCRIPT_DIR"|| exit 1

./build.sh

docker compose up -d --build
