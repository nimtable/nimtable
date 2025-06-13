#!/bin/bash

# generate client code
echo "Generating account client code..."
npx openapi-ts -f acc-openapi-ts.config.ts

# add license header
echo "Adding license headers..."
./scripts/add-license.sh

echo "Done!" 