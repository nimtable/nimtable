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

    // Nimtable's per-table endpoints (distribution/manifest/optimize) receive the
    // namespace as one path segment with levels joined by '.', matching the
    // frontend's internal dot-separated representation (see web data-loader; the
    // 0x1F separator is used only on the Iceberg REST listing path). Split on '.'
    // to rebuild a real multi-level Namespace; a flat namespace yields one element.
    private static final String SEPARATOR = "\\.";

    private NamespaceUtil() {}

    public static Namespace parse(String namespace) {
        return Namespace.of(namespace.split(SEPARATOR));
    }
}
