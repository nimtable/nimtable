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

import type {
  DistributionData,
  FetchSampleDataResult,
  LoadTableResult,
  NamespaceTables,
} from "@/lib/data-loader"

export type DemoTableKey = `${string}.${string}.${string}`

export const DEMO_CATALOGS: string[] = ["demo"]

export const DEMO_NAMESPACE_TABLES: Record<string, NamespaceTables[]> = {
  demo: [
    {
      name: "public",
      shortName: "public",
      tables: ["users", "orders"],
      children: [],
    },
  ],
}

const now = Date.now()

const baseSnapshots: any[] = [
  {
    "snapshot-id": "1",
    "parent-snapshot-id": null,
    "timestamp-ms": now - 1000 * 60 * 60 * 24,
    summary: {
      operation: "append",
      "added-data-files": 2,
      "added-records": 5000,
    },
  },
  {
    "snapshot-id": "2",
    "parent-snapshot-id": "1",
    "timestamp-ms": now - 1000 * 60 * 30,
    summary: {
      operation: "replace",
      "total-data-files-changed": 1,
    },
  },
]

const schemas: any[] = [
  {
    type: "struct",
    "schema-id": 0,
    fields: [
      { id: 1, name: "id", type: "long", required: true },
      { id: 2, name: "name", type: "string", required: true },
      { id: 3, name: "email", type: "string", required: true },
      { id: 4, name: "created_at", type: "timestamp", required: true },
    ],
  },
]

const orderSchema: any[] = [
  {
    type: "struct",
    "schema-id": 0,
    fields: [
      { id: 1, name: "order_id", type: "long", required: true },
      { id: 2, name: "user_id", type: "long", required: true },
      { id: 3, name: "amount", type: "double", required: true },
      { id: 4, name: "status", type: "string", required: true },
      { id: 5, name: "created_at", type: "timestamp", required: true },
    ],
  },
]

const commonMetadata = {
  "current-schema-id": 0,
  "partition-specs": [
    {
      "spec-id": 0,
      fields: [],
    },
  ],
  "default-spec-id": 0,
  properties: {
    owner: "demo",
    environment: "preview",
  },
  "metadata-log": [],
  "snapshot-log": [],
}

export const DEMO_TABLE_METADATA: Record<DemoTableKey, LoadTableResult> = {
  "demo.public.users": {
    metadata: {
      ...commonMetadata,
      "format-version": 2,
      location: "s3://demo-bucket/warehouse/demo/public/users",
      "table-uuid": "demo-users-uuid",
      schemas,
      snapshots: baseSnapshots,
      refs: {
        main: { type: "branch", "snapshot-id": "2" },
        tag_latest: { type: "tag", "snapshot-id": "2" },
      },
      "last-updated-ms": now - 1000 * 60 * 15,
    },
  },
  "demo.public.orders": {
    metadata: {
      ...commonMetadata,
      "format-version": 2,
      location: "s3://demo-bucket/warehouse/demo/public/orders",
      "table-uuid": "demo-orders-uuid",
      schemas: orderSchema,
      snapshots: baseSnapshots,
      refs: {
        main: { type: "branch", "snapshot-id": "2" },
      },
      "last-updated-ms": now - 1000 * 60 * 45,
    },
  },
}

export const DEMO_TABLE_DISTRIBUTIONS: Record<DemoTableKey, DistributionData> =
  {
    "demo.public.users": {
      ranges: {
        "0-8M": { count: 1, percentage: 10 },
        "8M-32M": { count: 4, percentage: 40 },
        "32M-128M": { count: 3, percentage: 30 },
        "128M-512M": { count: 2, percentage: 20 },
        "512M+": { count: 0, percentage: 0 },
      },
      dataFileCount: 10,
      positionDeleteFileCount: 0,
      eqDeleteFileCount: 0,
      dataFileSizeInBytes: 320 * 1024 * 1024,
      positionDeleteFileSizeInBytes: 0,
      eqDeleteFileSizeInBytes: 0,
      dataFileRecordCount: 50000,
      positionDeleteFileRecordCount: 0,
      eqDeleteFileRecordCount: 0,
    },
    "demo.public.orders": {
      ranges: {
        "0-8M": { count: 1, percentage: 5 },
        "8M-32M": { count: 5, percentage: 50 },
        "32M-128M": { count: 3, percentage: 30 },
        "128M-512M": { count: 1, percentage: 15 },
        "512M+": { count: 0, percentage: 0 },
      },
      dataFileCount: 9,
      positionDeleteFileCount: 0,
      eqDeleteFileCount: 0,
      dataFileSizeInBytes: 280 * 1024 * 1024,
      positionDeleteFileSizeInBytes: 0,
      eqDeleteFileSizeInBytes: 0,
      dataFileRecordCount: 35000,
      positionDeleteFileRecordCount: 0,
      eqDeleteFileRecordCount: 0,
    },
  }

export const DEMO_SAMPLE_DATA: Record<DemoTableKey, FetchSampleDataResult> = {
  "demo.public.users": {
    columns: ["id", "name", "email", "created_at"],
    rows: [
      [1, "Alice", "alice@example.com", "2025-01-01 10:00:00"],
      [2, "Bob", "bob@example.com", "2025-01-02 11:00:00"],
      [3, "Carol", "carol@example.com", "2025-01-03 12:00:00"],
      [4, "David", "david@example.com", "2025-01-04 13:00:00"],
      [5, "Eve", "eve@example.com", "2025-01-05 14:00:00"],
    ],
    totalRows: 5,
    totalPages: 1,
  },
  "demo.public.orders": {
    columns: ["order_id", "user_id", "amount", "status", "created_at"],
    rows: [
      [101, 1, 120.5, "COMPLETED", "2025-01-01 12:00:00"],
      [102, 2, 42.0, "PENDING", "2025-01-02 12:10:00"],
      [103, 3, 90.0, "COMPLETED", "2025-01-03 12:20:00"],
      [104, 1, 15.75, "FAILED", "2025-01-04 12:30:00"],
      [105, 4, 250.0, "COMPLETED", "2025-01-05 12:40:00"],
    ],
    totalRows: 5,
    totalPages: 1,
  },
}

export function getDemoTableKey(
  catalog: string,
  namespace: string,
  table: string
): DemoTableKey {
  return `${catalog}.${namespace}.${table}`
}
