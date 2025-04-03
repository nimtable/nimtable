import type { NamespaceTables } from "@/types/data"
import { EXAMPLE_CATALOGS, EXAMPLE_NAMESPACES } from "@/lib/demo-sidebar-data"

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

export interface LoadTableResult {
    metadata: {
        "table-uuid": string
        location: string
        "last-updated-ms"?: number
        "current-schema-id": number
        schemas?: Array<{
            "schema-id": number
            fields: StructField[]
        }>
        properties?: Record<string, string>
        refs?: Record<
            string,
            {
                type: "branch" | "tag"
                "snapshot-id": string | number
                "max-ref-age-ms"?: number
                "min-snapshots-to-keep"?: number
            }
        >
        snapshots?: Array<{
            "snapshot-id": string | number
            "parent-snapshot-id"?: string | number
            "sequence-number"?: number
            "timestamp-ms": number
            summary: {
                operation: "append" | "replace" | "overwrite" | "delete";
                [key: string]: any;
            }
            "schema-id"?: number
        }>
    }
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
    const oneMonth = 30 * oneDay

    const timestamp5 = now - Math.floor(Math.random() * oneDay) // Most recent (within last day)
    const timestamp4 = timestamp5 - Math.floor(oneDay + Math.random() * oneDay * 3) // 1-4 days before snapshot 5
    const timestamp3 = timestamp4 - Math.floor(oneDay * 2 + Math.random() * oneDay * 5) // 2-7 days before snapshot 4
    const timestamp2 = timestamp3 - Math.floor(oneWeek + Math.random() * oneWeek) // 1-2 weeks before snapshot 3
    const timestamp1 = timestamp2 - Math.floor(oneWeek * 2 + Math.random() * oneWeek * 2) // 2-4 weeks before snapshot 2

    // Generate a mock table result with realistic snapshot history
    return {
        metadata: {
            "table-uuid": `b55d9dda-6561-4304-99a7-f8d213eeb89${Math.floor(Math.random() * 10)}`,
            location: `s3://warehouse/${namespace}/${table}`,
            "last-updated-ms": timestamp5,
            "current-schema-id": 2,
            schemas: [
                {
                    "schema-id": 1,
                    fields: [
                        { id: 1, name: "id", type: "long", required: true },
                        { id: 2, name: "name", type: "string", required: true },
                        { id: 3, name: "email", type: "string", required: false },
                        { id: 4, name: "created_at", type: "timestamp", required: true },
                    ],
                },
                {
                    "schema-id": 2,
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
                    "schema-id": 2,
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
                    summary: {
                        operation: "delete",
                        "deleted-data-files": "1",
                        "deleted-records": "100",
                        "deleted-files-size": "10240000",
                    },
                },
            ],
        },
    }
}

/**
 * Drop a table from a namespace
 */
export async function dropTable(catalog: string, namespace: string, table: string): Promise<{ success: boolean }> {
    // Simulate network delay (800-1200ms)
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))

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

    return { success: true }
}

/**
 * Run a SQL query against the database
 */
export async function runQuery(query: string): Promise<{ columns: string[]; rows: any[][] } | { error: string }> {
    // Simulate network delay (1000-2000ms)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    // Check if the query contains "error" to simulate an error response
    if (query.toLowerCase().includes("error")) {
        return { error: "SQL syntax error near 'error'" }
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

/**
 * Get detailed information about tables in a namespace
 */
export interface NamespaceTable {
    name: string
    formatVersion: string
    dataSizeBytes: number
    partitioning: string | null
    lastUpdated: number
}

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

        return {
            name: tableName,
            formatVersion: random(7) > 0.3 ? "v2" : "v1",
            dataSizeBytes: Math.floor(10000000 + random(13) * 10000000000), // Between 10MB and 10GB
            partitioning: [null, "Hash(id)", "Range(date)", "Hash(id), Range(date)", "Hash(region), Range(timestamp)"][
                Math.floor(random(19) * 5)
            ],
            lastUpdated: Date.now() - Math.floor(random(23) * 30 * 86400000), // Up to 30 days ago
        }
    })
}
