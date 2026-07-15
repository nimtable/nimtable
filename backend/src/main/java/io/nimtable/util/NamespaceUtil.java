/*
 * Copyright 2026 Nimtable
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

package io.nimtable.util;

import org.apache.iceberg.catalog.Namespace;

public final class NamespaceUtil {

    // Multi-level namespace parts arrive from the frontend separated by the 0x1F
    // unit separator on the wire (see the web data-loader `namespaceParts`). Split
    // on it to rebuild a real multi-level Namespace; a flat namespace yields a
    // single element.
    private static final String SEPARATOR = "\\u001f";

    private NamespaceUtil() {}

    public static Namespace parse(String namespace) {
        return Namespace.of(namespace.split(SEPARATOR));
    }
}
