#!/bin/bash

# license header
LICENSE_HEADER='/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'

add_license() {
    local file="$1"
    if ! grep -q "Copyright 2025 Nimtable" "$file"; then
        echo "Adding license header to $file"
        echo "$LICENSE_HEADER" | cat - "$file" > temp && mv temp "$file"
    fi
}

# process all TypeScript files in both directories
find src/lib/client src/lib/acc-api/client -name "*.ts" | while read -r file; do
    add_license "$file"
done

echo "License headers added successfully!" 