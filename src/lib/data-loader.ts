/*
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
import { EXAMPLE_CATALOGS, EXAMPLE_NAMESPACES } from "@/lib/demo-sidebar-data"

// Types for the sidebar data structure
export interface NamespaceTables {
    name: string // full namespace name
    shortName: string // last part of the namespace name
    tables: string[]
    children: NamespaceTables[]
}

// Types moved from api.ts
export interface CatalogConfig {
    defaults?: Record<string, string>
    overrides?: Record<string, string>
}

export interface StructField {
    id: number
    name: string
    type: string | { type: string }
    required: boolean
}

export interface StructType {
    type: "struct";
    fields: StructField[];
}

export interface BlobMetadata {
    type: string;
    /** @format int64 */
    "snapshot-id": string;
    /** @format int64 */
    "sequence-number": number;
    fields: number[];
    properties?: Record<string, string>;
}

export interface StatisticsFile {
    /** @format int64 */
    "snapshot-id": string;
    "statistics-path": string;
    /** @format int64 */
    "file-size-in-bytes": number;
    /** @format int64 */
    "file-footer-size-in-bytes": number;
    "blob-metadata": BlobMetadata[];
}

export type Schema = StructType & {
    "schema-id"?: number;
    "identifier-field-ids"?: number[];
};

export interface TableMetadata {
    /**
     * @min 1
     * @max 2
     */
    "format-version": number;
    "table-uuid": string;
    location?: string;
    /** @format int64 */
    "last-updated-ms"?: number;
    properties?: Record<string, string>;
    schemas?: Schema[];
    "current-schema-id"?: number;
    "last-column-id"?: number;
    "partition-specs"?: PartitionSpec[];
    "default-spec-id"?: number;
    "last-partition-id"?: number;
    "sort-orders"?: SortOrder[];
    "default-sort-order-id"?: number;
    snapshots?: Snapshot[];
    refs?: SnapshotReferences;
    /** @format int64 */
    "current-snapshot-id"?: string;
    /** @format int64 */
    "last-sequence-number"?: number;
    "snapshot-log"?: SnapshotLog;
    "metadata-log"?: MetadataLog;
    statistics?: StatisticsFile[];
    "partition-statistics"?: PartitionStatisticsFile[];
}

export type MetadataLog = {
    "metadata-file": string;
    /** @format int64 */
    "timestamp-ms": number;
}[];


export interface PartitionStatisticsFile {
    /** @format int64 */
    "snapshot-id": string;
    "statistics-path": string;
    /** @format int64 */
    "file-size-in-bytes": number;
}

export type SnapshotLog = {
    /** @format int64 */
    "snapshot-id": string;
    /** @format int64 */
    "timestamp-ms": number;
}[];

export interface SnapshotReference {
    type: "tag" | "branch";
    /** @format int64 */
    "snapshot-id": string;
    /** @format int64 */
    "max-ref-age-ms"?: number;
    /** @format int64 */
    "max-snapshot-age-ms"?: number;
    "min-snapshots-to-keep"?: number;
}

export type SnapshotReferences = Record<string, SnapshotReference>;

/** @example ["identity","year","month","day","hour","bucket[256]","truncate[16]"] */
export type Transform = string;

export interface SortField {
    "source-id": number;
    transform: Transform;
    direction: SortDirection;
    "null-order": NullOrder;
}

export enum NullOrder {
    NullsFirst = "nulls-first",
    NullsLast = "nulls-last",
}

export enum SortDirection {
    Asc = "asc",
    Desc = "desc",
}

export interface SortOrder {
    "order-id": number;
    fields: SortField[];
}

export interface LoadTableResult {
    /** May be null if the table is staged as part of a transaction */
    "metadata-location"?: string;
    metadata: TableMetadata;
    config?: Record<string, string>;
    "storage-credentials"?: StorageCredential[];
}

export interface StorageCredential {
    /** Indicates a storage location prefix where the credential is relevant. Clients should choose the most specific prefix (by selecting the longest prefix) if several credentials of the same type are available. */
    prefix: string;
    config: Record<string, string>;
}

export interface Snapshot {
    /** @format int64 */
    "snapshot-id": string;
    /** @format int64 */
    "parent-snapshot-id"?: string;
    /** @format int64 */
    "sequence-number"?: number;
    /** @format int64 */
    "timestamp-ms": number;
    /** Location of the snapshot's manifest list file */
    "manifest-list": string;
    summary: {
        operation: "append" | "replace" | "overwrite" | "delete";
        [key: string]: any;
    };
    "schema-id"?: number;
}

/**
 * Demo implementation of loadCatalogNames that returns example data
 * with simulated network delay
 */
export async function loadCatalogNames(): Promise<string[]> {
    // Simulate network delay (600-1200ms)
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 600))

    // Return example catalogs from demo data
    return EXAMPLE_CATALOGS
}

/**
 * Demo implementation of loadNamespacesAndTables that returns example data
 * with simulated network delay
 */
export async function loadNamespacesAndTables(catalog: string): Promise<NamespaceTables[]> {
    // Simulate network delay (800-1500ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))

    // Return example namespaces for the given catalog, or empty array if not found
    return EXAMPLE_NAMESPACES[catalog] || []
}

/**
 * Demo implementation of listNamespaces that returns example namespace names
 * with simulated network delay
 */
export async function listNamespaces(catalog: string): Promise<string[]> {
    // Simulate network delay (700-1300ms)
    await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 600))

    // Get namespaces from example data
    const namespaces = EXAMPLE_NAMESPACES[catalog] || []

    // Flatten the namespace tree into a list of namespace names
    const flattenNamespaces = (ns: NamespaceTables[]): string[] => {
        return ns.reduce((acc, namespace) => {
            return [...acc, namespace.name, ...flattenNamespaces(namespace.children)]
        }, [] as string[])
    }

    return flattenNamespaces(namespaces)
}

/**
 * Demo implementation of getCatalogConfig that returns example configuration
 * with simulated network delay
 */
export async function getCatalogConfig(catalog: string): Promise<CatalogConfig> {
    // Simulate network delay (800-1400ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600))

    // Return mock config based on catalog name
    const configs: Record<string, CatalogConfig> = {
        production: {
            defaults: {
                "write.format.default": "parquet",
                "write.parquet.compression-codec": "snappy",
                "write.metadata.compression-codec": "gzip",
                "write.metadata.metrics.default": "full",
            },
            overrides: {
                "write.target-file-size-bytes": "536870912",
                "write.distribution-mode": "hash",
                "write.wap.enabled": "true",
            },
        },
        development: {
            defaults: {
                "write.format.default": "parquet",
                "write.parquet.compression-codec": "zstd",
                "write.metadata.compression-codec": "gzip",
                "write.metadata.metrics.default": "truncate",
            },
            overrides: {
                "write.target-file-size-bytes": "134217728",
                "write.distribution-mode": "none",
                "write.wap.enabled": "false",
            },
        },
        testing: {
            defaults: {
                "write.format.default": "parquet",
                "write.parquet.compression-codec": "none",
                "write.metadata.compression-codec": "none",
                "write.metadata.metrics.default": "none",
            },
            overrides: {
                "write.target-file-size-bytes": "67108864",
                "write.distribution-mode": "none",
                "write.wap.enabled": "false",
            },
        },
        analytics: {
            defaults: {
                "write.format.default": "parquet",
                "write.parquet.compression-codec": "snappy",
                "write.metadata.compression-codec": "gzip",
                "write.metadata.metrics.default": "full",
            },
            overrides: {
                "write.target-file-size-bytes": "1073741824",
                "write.distribution-mode": "range",
                "write.wap.enabled": "true",
                "read.split.target-size": "268435456",
                "read.split.planning.strategy": "binpack",
            },
        },
    }

    // Return config for the requested catalog, or a default if not found
    return (
        configs[catalog] || {
            defaults: {
                "write.format.default": "parquet",
                "write.parquet.compression-codec": "snappy",
            },
            overrides: {},
        }
    )
}

/**
 * Load table data including metadata, schema, and snapshots
 */
export async function loadTableData(catalog: string, namespace: string, table: string): Promise<LoadTableResult> {
    // Simulate network delay (800-1500ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))
    console.log("loadTableData", catalog, namespace, table)

    // Generate realistic 64-bit snapshot IDs (as strings to avoid precision issues)
    const generateSnapshotId = () => {
        // Generate a 16-character hex string (64 bits)
        return BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
            .toString()
            .padStart(19, "1")
    }

    // Create snapshot IDs
    const snapshotId1 = generateSnapshotId()
    const snapshotId2 = generateSnapshotId()
    const snapshotId3 = generateSnapshotId()
    const snapshotId4 = generateSnapshotId()
    const snapshotId5 = generateSnapshotId()

    // Calculate timestamps with realistic intervals
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay

    const timestamp5 = now - Math.floor(Math.random() * oneDay) // Most recent (within last day)
    const timestamp4 = timestamp5 - Math.floor(oneDay + Math.random() * oneDay * 3) // 1-4 days before snapshot 5
    const timestamp3 = timestamp4 - Math.floor(oneDay * 2 + Math.random() * oneDay * 5) // 2-7 days before snapshot 4
    const timestamp2 = timestamp3 - Math.floor(oneWeek + Math.random() * oneWeek) // 1-2 weeks before snapshot 3
    const timestamp1 = timestamp2 - Math.floor(oneWeek * 2 + Math.random() * oneWeek * 2) // 2-4 weeks before snapshot 2

    // Generate a mock table result with realistic snapshot history
    return {
        "metadata-location": `s3://warehouse/${namespace}/${table}/metadata/metadata.json`,
        metadata: {
            "format-version": 2,
            "table-uuid": `b55d9dda-6561-4304-99a7-f8d213eeb89${Math.floor(Math.random() * 10)}`,
            location: `s3://warehouse/${namespace}/${table}`,
            "last-updated-ms": timestamp5,
            "current-schema-id": 2,
            "current-snapshot-id": snapshotId5,
            "last-sequence-number": 5,
            schemas: [
                {
                    "schema-id": 1,
                    type: "struct",
                    fields: [
                        { id: 1, name: "id", type: "long", required: true },
                        { id: 2, name: "name", type: "string", required: true },
                        { id: 3, name: "email", type: "string", required: false },
                        { id: 4, name: "created_at", type: "timestamp", required: true },
                    ],
                },
                {
                    "schema-id": 2,
                    type: "struct",
                    fields: [
                        { id: 1, name: "id", type: "long", required: true },
                        { id: 2, name: "name", type: "string", required: true },
                        { id: 3, name: "email", type: "string", required: false },
                        { id: 4, name: "created_at", type: "timestamp", required: true },
                        { id: 5, name: "updated_at", type: "timestamp", required: false },
                        { id: 6, name: "status", type: "string", required: false },
                    ],
                },
            ],
            properties: {
                "write.format.default": "parquet",
                "write.parquet.compression-codec": "snappy",
                "write.metadata.compression-codec": "gzip",
                "write.metadata.metrics.default": "full",
                "commit.retry.num-retries": "4",
                "commit.retry.min-wait-ms": "100",
                "commit.retry.max-wait-ms": "60000",
            },
            refs: {
                main: {
                    type: "branch",
                    "snapshot-id": snapshotId5,
                    "max-ref-age-ms": 172800000,
                    "min-snapshots-to-keep": 10,
                },
                prod: {
                    type: "branch",
                    "snapshot-id": snapshotId3,
                    "max-ref-age-ms": 604800000,
                    "min-snapshots-to-keep": 20,
                },
                "v1.0.0": {
                    type: "tag",
                    "snapshot-id": snapshotId1,
                    "max-ref-age-ms": 2592000000,
                },
                "v1.1.0": {
                    type: "tag",
                    "snapshot-id": snapshotId3,
                    "max-ref-age-ms": 2592000000,
                },
                development: {
                    type: "branch",
                    "snapshot-id": snapshotId4,
                    "max-ref-age-ms": 172800000,
                    "min-snapshots-to-keep": 5,
                },
            },
            snapshots: [
                {
                    "snapshot-id": snapshotId1,
                    "timestamp-ms": timestamp1,
                    "sequence-number": 1,
                    "manifest-list": `s3://warehouse/${namespace}/${table}/metadata/snap-${snapshotId1}-1.avro`,
                    summary: {
                        operation: "append",
                        "added-data-files": "10",
                        "added-records": "1000",
                        "added-files-size": "102400000",
                    },
                },
                {
                    "snapshot-id": snapshotId2,
                    "parent-snapshot-id": snapshotId1,
                    "sequence-number": 2,
                    "timestamp-ms": timestamp2,
                    "manifest-list": `s3://warehouse/${namespace}/${table}/metadata/snap-${snapshotId2}-1.avro`,
                    summary: {
                        operation: "append",
                        "added-data-files": "5",
                        "added-records": "500",
                        "added-files-size": "51200000",
                    },
                },
                {
                    "snapshot-id": snapshotId3,
                    "parent-snapshot-id": snapshotId2,
                    "sequence-number": 3,
                    "timestamp-ms": timestamp3,
                    "manifest-list": `s3://warehouse/${namespace}/${table}/metadata/snap-${snapshotId3}-1.avro`,
                    summary: {
                        operation: "append",
                        "added-data-files": "8",
                        "added-records": "800",
                        "added-files-size": "81920000",
                    },
                },
                {
                    "snapshot-id": snapshotId4,
                    "parent-snapshot-id": snapshotId3,
                    "sequence-number": 4,
                    "timestamp-ms": timestamp4,
                    "manifest-list": `s3://warehouse/${namespace}/${table}/metadata/snap-${snapshotId4}-1.avro`,
                    summary: {
                        operation: "overwrite",
                        "added-data-files": "3",
                        "deleted-data-files": "2",
                        "added-records": "300",
                        "deleted-records": "200",
                        "added-files-size": "30720000",
                    },
                },
                {
                    "snapshot-id": snapshotId5,
                    "parent-snapshot-id": snapshotId4,
                    "sequence-number": 5,
                    "timestamp-ms": timestamp5,
                    "manifest-list": `s3://warehouse/${namespace}/${table}/metadata/snap-${snapshotId5}-1.avro`,
                    summary: {
                        operation: "delete",
                        "deleted-data-files": "1",
                        "deleted-records": "100",
                        "deleted-files-size": "10240000",
                    },
                },
            ],
        },
        config: {
            "client.region": "us-west-2",
            "s3.access-key-id": "mock-access-key",
            "s3.secret-access-key": "mock-secret-key",
        },
        "storage-credentials": [
            {
                prefix: `s3://warehouse/${namespace}/${table}`,
                config: {
                    "access-key-id": "mock-access-key",
                    "secret-access-key": "mock-secret-key",
                    region: "us-west-2",
                },
            },
        ],
    }
}

/**
 * Drop a table from a namespace
 */
export async function dropTable(catalog: string, namespace: string, table: string): Promise<{ success: boolean }> {
    // Simulate network delay (800-1200ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))
    console.log("dropTable", catalog, namespace, table)

    return { success: true }
}

/**
 * Rename a table within a namespace
 */
export async function renameTable(
    catalog: string,
    sourceNamespace: string,
    sourceTable: string,
    destinationTable: string,
): Promise<{ success: boolean }> {
    // Simulate network delay (800-1200ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))
    console.log("renameTable", catalog, sourceNamespace, sourceTable, destinationTable)

    return { success: true }
}

/**
 * Run a SQL query against the database
 */
export async function runQuery(query: string): Promise<{ columns: string[]; rows: any[][], error?: string }> {
    // Simulate network delay (1000-2000ms)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    // Check if the query contains "error" to simulate an error response
    if (query.toLowerCase().includes("error")) {
        return { columns: [], rows: [], error: "SQL syntax error near 'error'" }
    }

    // Generate mock query results
    const columns = ["id", "name", "email", "created_at", "active"]
    const rows = Array.from({ length: 20 }, (_, i) => [
        i + 1,
        `User ${i + 1}`,
        `user${i + 1}@example.com`,
        new Date(Date.now() - Math.random() * 31536000000).toISOString(),
        Math.random() > 0.3,
    ])

    return { columns, rows }
}

/**
 * Get manifest list for a snapshot
 */
export async function getManifestList(
    catalog: string,
    namespace: string,
    table: string,
    snapshotId: string | number,
): Promise<{
    snapshot_id: string
    manifest_list_location: string
    manifests: any[]
}> {
    // Simulate network delay (800-1500ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))
    console.log("getManifestList", catalog, namespace, table, snapshotId)

    return {
        snapshot_id: String(snapshotId),
        manifest_list_location: `s3://warehouse/${namespace}/${table}/metadata/snap-${snapshotId}.avro`,
        manifests: Array.from({ length: 5 }, (_, i) => ({
            manifest_path: `s3://warehouse/${namespace}/${table}/metadata/manifest-${i}.avro`,
            manifest_length: 4096 + Math.floor(Math.random() * 8192),
            partition_spec_id: 0,
            content: i % 2 === 0 ? "data" : "delete",
            sequence_number: Number(snapshotId),
            min_sequence_number: Number(snapshotId) - 1,
            added_snapshot_id: Number(snapshotId),
            added_files_count: 10 + Math.floor(Math.random() * 20),
            existing_files_count: 5 + Math.floor(Math.random() * 10),
            deleted_files_count: Math.floor(Math.random() * 5),
            added_rows_count: 1000 + Math.floor(Math.random() * 5000),
            existing_rows_count: 500 + Math.floor(Math.random() * 2000),
            deleted_rows_count: Math.floor(Math.random() * 500),
        })),
    }
}

/**
 * Get manifest details for a specific manifest
 */
export async function getManifestDetails(
    catalog: string,
    namespace: string,
    table: string,
    snapshotId: string | number,
    manifestIndex: number,
): Promise<{
    manifest_path: string
    files: any[]
}> {
    // Simulate network delay (800-1500ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))
    console.log("getManifestDetails", catalog, namespace, table, snapshotId, manifestIndex)

    return {
        manifest_path: `s3://warehouse/${namespace}/${table}/metadata/manifest-${manifestIndex}.avro`,
        files: Array.from({ length: 8 }, (_, i) => ({
            content: i % 2 === 0 ? "data" : "delete",
            file_path: `s3://warehouse/${namespace}/${table}/data/part-${manifestIndex}-${i}.parquet`,
            file_format: "PARQUET",
            partition: {},
            record_count: 1000 + Math.floor(Math.random() * 10000),
            file_size_in_bytes: 1024 * 1024 * (1 + Math.floor(Math.random() * 10)),
            column_sizes: {
                "1": 1024 * 100 + Math.floor(Math.random() * 1024 * 100),
                "2": 1024 * 500 + Math.floor(Math.random() * 1024 * 500),
                "3": 1024 * 300 + Math.floor(Math.random() * 1024 * 300),
            },
            value_counts: {
                "1": 1000 + Math.floor(Math.random() * 10000),
                "2": 1000 + Math.floor(Math.random() * 10000),
                "3": 1000 + Math.floor(Math.random() * 10000),
            },
            null_value_counts: {
                "1": 0,
                "2": Math.floor(Math.random() * 100),
                "3": Math.floor(Math.random() * 500),
            },
            lower_bounds: {
                "1": "1",
                "2": "a",
            },
            upper_bounds: {
                "1": "9999",
                "2": "z",
            },
        })),
    }
}

// Define the PartitionField interface
export interface PartitionField {
    name: string
    transform: string
    "source-id": number
    "field-id"?: number
}

// Define the PartitionSpec interface
export interface PartitionSpec {
    "spec-id": number
    fields: PartitionField[]
}

/**
 * Get detailed information about tables in a namespace
 */
export interface NamespaceTable {
    name: string
    formatVersion: string
    dataSizeBytes: number
    partitionSpecs: PartitionSpec[]
    lastUpdated: number
}

// Update the getNamespaceTables function to return more complex partition specs
export async function getNamespaceTables(catalog: string, namespace: string): Promise<NamespaceTable[]> {
    // Simulate network delay (800-1500ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))

    // Get the namespace data from our example data
    const namespaces = EXAMPLE_NAMESPACES[catalog] || []

    // Find the matching namespace (could be nested)
    const findNamespace = (namespaces: NamespaceTables[], targetNamespace: string): NamespaceTables | undefined => {
        for (const ns of namespaces) {
            if (ns.name === targetNamespace) {
                return ns
            }

            const childResult = findNamespace(ns.children, targetNamespace)
            if (childResult) {
                return childResult
            }
        }
        return undefined
    }

    const namespaceData = findNamespace(namespaces, namespace)

    if (!namespaceData) {
        return []
    }

    // Generate detailed information for each table
    return namespaceData.tables.map((tableName) => {
        // Generate random but consistent data for each table
        const tableNameHash = tableName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const random = (seed: number) => ((tableNameHash * seed) % 100) / 100

        // Generate a more complex partition spec based on the table name hash
        const partitionSpecType = Math.floor(random(19) * 5)
        let partitionSpecs: PartitionSpec[] = []

        switch (partitionSpecType) {
            case 0:
                // No partitioning
                partitionSpecs = [{ "spec-id": 0, fields: [] }]
                break
            case 1:
                // Bucket partitioning
                partitionSpecs = [
                    {
                        "spec-id": 0,
                        fields: [
                            {
                                name: "id_bucket",
                                transform: "bucket[4]",
                                "source-id": 1,
                                "field-id": 1000,
                            },
                        ],
                    },
                ]
                break
            case 2:
                // Identity partitioning
                partitionSpecs = [
                    {
                        "spec-id": 0,
                        fields: [
                            {
                                name: "id",
                                transform: "identity",
                                "source-id": 1,
                                "field-id": 1000,
                            },
                        ],
                    },
                ]
                break
            case 3:
                // Time-based partitioning
                partitionSpecs = [
                    {
                        "spec-id": 0,
                        fields: [
                            {
                                name: "ts_year",
                                transform: "year",
                                "source-id": 2,
                                "field-id": 1001,
                            },
                        ],
                    },
                ]
                break
            case 4:
                // Multiple partition fields
                partitionSpecs = [
                    {
                        "spec-id": 0,
                        fields: [
                            {
                                name: "id",
                                transform: "identity",
                                "source-id": 1,
                                "field-id": 1000,
                            },
                            {
                                name: "ts_year",
                                transform: "year",
                                "source-id": 2,
                                "field-id": 1001,
                            },
                        ],
                    },
                ]
                break
            default:
                partitionSpecs = []
        }

        return {
            name: tableName,
            formatVersion: random(7) > 0.3 ? "v2" : "v1",
            dataSizeBytes: Math.floor(10000000 + random(13) * 10000000000), // Between 10MB and 10GB
            partitionSpecs: partitionSpecs,
            lastUpdated: Date.now() - Math.floor(random(23) * 30 * 86400000), // Up to 30 days ago
        }
    })
}

// Add these new interfaces and functions at the end of the file

export interface DistributionItem {
    count: number
    percentage: number
}

export interface DistributionData {
    [range: string]: DistributionItem
}

/**
 * Get file size distribution for a table
 */
export async function getFileDistribution(
    catalog: string,
    namespace: string,
    table: string,
): Promise<DistributionData> {
    // Simulate network delay (800-1200ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))
    console.log("getFileDistribution", catalog, namespace, table)

    // Mock distribution data
    return {
        "0-8M": { count: 42, percentage: 15 },
        "8M-32M": { count: 78, percentage: 28 },
        "32M-128M": { count: 103, percentage: 37 },
        "128M-512M": { count: 45, percentage: 16 },
        "512M+": { count: 12, percentage: 4 },
    }
}

export type OptimizationOperation = "Compaction" | "Snapshot Expiration" | "Orphan File Cleanup"

export interface OptimizationSettings {
    snapshotRetention: boolean,
    retentionPeriod: string,
    minSnapshotsToKeep: string,
    orphanFileDeletion: boolean,
    orphanFileRetention: string,
    compaction: boolean,
}

/**
 * Run an optimization operation on a table
 */
export async function runOptimizationOperation(
    operation: OptimizationOperation,
    catalog: string,
    namespace: string,
    table: string,
    settings?: OptimizationSettings,
): Promise<any> {
    // Simulate network delay (1000-2000ms)
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 500))
    console.log("runOptimizationOperation", operation, catalog, namespace, table, settings)

    // Mock successful response based on operation type
    const mockResults = {
        Compaction: {
            rewrittenDataFilesCount: 45,
            addedDataFilesCount: 12,
        },
        "Snapshot Expiration": {
            deletedDataFilesCount: 23,
            deletedManifestFilesCount: 5,
        },
        "Orphan File Cleanup": {
            orphanFileLocations: Array(8).fill("s3://path/to/orphan/file"),
        },
    }

    return mockResults[operation]
}

/**
 * Schedule optimization operations for a table
 */
export async function scheduleOptimization(
    catalog: string,
    namespace: string,
    table: string,
    settings?: OptimizationSettings,
): Promise<{ success: boolean }> {
    // Simulate network delay (800-1200ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))
    console.log("scheduleOptimization", catalog, namespace, table, settings)

    return { success: true }
}

export interface PaginationParams {
    page: number
    pageSize: number
}

export interface FetchSampleDataResult {
    columns: string[]
    rows: any[][]
    totalRows: number
    totalPages: number
}

export async function fetchSampleData(
    catalog: string,
    namespace: string,
    table: string,
    pagination: PaginationParams
): Promise<FetchSampleDataResult> {
    console.log("fetchSampleData", catalog, namespace, table, pagination)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate mock column names based on table name to make it look realistic
    const columnNames = ["id", "name", "created_at", "updated_at", `${table.toLowerCase()}_type`, "is_active"]

    // Generate a larger dataset for pagination
    const totalRows = 100
    const allRows = Array.from({ length: totalRows }, (_, i) => {
        return [
            i + 1,
            `Sample ${table} ${i + 1}`,
            new Date(Date.now() - Math.random() * 31536000000).toISOString(),
            new Date(Date.now() - Math.random() * 15768000000).toISOString(),
            ["Type A", "Type B", "Type C"][Math.floor(Math.random() * 3)],
            Math.random() > 0.3,
        ]
    })

    // Calculate pagination
    const { page, pageSize } = pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalRows)
    const paginatedRows = allRows.slice(startIndex, endIndex)
    const totalPages = Math.ceil(totalRows / pageSize)

    return {
        columns: columnNames,
        rows: paginatedRows,
        totalRows,
        totalPages,
    }
}
