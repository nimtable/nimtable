#!/bin/bash

# generate client code
echo "Generating client code..."
npx @hey-api/openapi-ts ...

# add license header
echo "Adding license headers..."
./scripts/add-license.sh

echo "Done!" 