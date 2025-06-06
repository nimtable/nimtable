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
import { Api } from "@/lib/api"

import { CatalogConfig, LoadTableResult, PartitionSpec } from "./api"
import { getCatalogs } from "./client/sdk.gen"
import { getApiBaseUrl } from "./api-config"

// Re-export types from api.ts, ensuring application code don't need to access the api directly.
export type {
  CatalogConfig,
  StructField,
  LoadTableResult,
  PartitionSpec,
} from "./api"

function catalogApi(catalog: string, inBrowser: boolean = true) {
  return new Api({
    baseUrl: `${getApiBaseUrl(inBrowser)}/api/catalog/${catalog}`,
  })
}

// Helper function to detect if we're running in browser
function isBrowser() {
  return typeof window !== "undefined"
}

export async function loadCatalogNames(): Promise<string[]> {
  try {
    // In browser environment, use the regular SDK client
    if (isBrowser()) {
      const response = await getCatalogs()
      return response.data || []
    }

    // In server environment, make a direct fetch call with full URL
    const baseUrl = getApiBaseUrl(false)
    const response = await fetch(`${baseUrl}/api/catalogs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch catalogs: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error("Error loading catalog names:", error)
    throw error
  }
}

// Types for the sidebar data structure
export interface NamespaceTables {
  name: string // full namespace name
  shortName: string // last part of the namespace name
  tables: string[]
  children: NamespaceTables[]
}

export async function loadNamespacesAndTables(
  catalog: string,
  inBrowser: boolean = true
): Promise<NamespaceTables[]> {
  const api = catalogApi(catalog, inBrowser)

  async function fetchNamespaceAndChildren(
    namespace: string[]
  ): Promise<NamespaceTables> {
    const namespaceName = namespace.join(".")
    const tablesResponse = await api.v1.listTables(namespaceName)

    // Get child namespaces
    const childNamespacesResponse = await api.v1.listNamespaces({
      parent: namespaceName,
    })
    const childNamespaces = childNamespacesResponse.namespaces || []

    // Recursively fetch child namespaces
    const children = await Promise.all(
      childNamespaces.map((child) => fetchNamespaceAndChildren(child))
    )

    // Sort children by shortName
    const sortedChildren = children.sort((a, b) =>
      a.shortName.localeCompare(b.shortName)
    )

    // Sort tables alphabetically
    const sortedTables = (
      tablesResponse.identifiers?.map((table) => table.name) || []
    ).sort()

    return {
      name: namespaceName,
      shortName: namespace[namespace.length - 1],
      tables: sortedTables,
      children: sortedChildren,
    }
  }

  // Start with root namespaces
  const response = await api.v1.listNamespaces()
  const rootNamespaces = response.namespaces || []

  // Fetch all namespaces and their children
  const result = await Promise.all(
    rootNamespaces.map((namespace) => fetchNamespaceAndChildren(namespace))
  )

  // Sort root namespaces by shortName
  return result.sort((a, b) => a.shortName.localeCompare(b.shortName))
}

export async function listNamespaces(catalog: string): Promise<string[]> {
  const api = catalogApi(catalog, isBrowser())

  // Start with root namespaces
  const response = await api.v1.listNamespaces()
  const rootNamespaces = response.namespaces || []
  return rootNamespaces.map((namespace) => namespace.join("."))
}

export async function getCatalogConfig(
  catalog: string
): Promise<CatalogConfig> {
  const api = catalogApi(catalog, isBrowser())
  return await api.v1.getConfig()
}

export async function loadTableData(
  catalog: string,
  namespace: string,
  table: string
): Promise<LoadTableResult> {
  const api = catalogApi(catalog, isBrowser())
  const response = await api.v1.loadTable(namespace, table)
  return response
}

export async function dropTable(
  catalog: string,
  namespace: string,
  table: string
): Promise<void> {
  const api = catalogApi(catalog)
  await api.v1.dropTable(namespace, table)
}

export async function renameTable(
  catalog: string,
  namespace: string,
  sourceTable: string,
  destinationTable: string
): Promise<void> {
  const api = catalogApi(catalog)
  await api.v1.renameTable({
    source: {
      namespace: namespace.split("/"),
      name: sourceTable,
    },
    destination: {
      namespace: namespace.split("/"),
      name: destinationTable,
    },
  })
}

export async function runQuery(
  query: string
): Promise<{ columns: string[]; rows: any[][]; error?: string }> {
  try {
    // In browser environment, use relative path
    if (isBrowser()) {
      const response = await fetch(
        `/api/query?query=${encodeURIComponent(query)}`
      )
      return await response.json()
    }

    // In server environment, use full URL
    const baseUrl = getApiBaseUrl(false)
    const response = await fetch(
      `${baseUrl}/api/query?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to execute query: ${response.status} ${response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    console.error("Error executing query:", error)
    return {
      columns: [],
      rows: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getManifestList(
  catalog: string,
  namespace: string,
  table: string,
  snapshotId: string | number
): Promise<{
  snapshot_id: string
  manifest_list_location: string
  manifests: any[]
}> {
  const response = await fetch(
    `/api/manifest/${catalog}/${namespace}/${table}/${snapshotId}`
  )
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}

/**
 * Get manifest details for a specific manifest
 */
export async function getManifestDetails(
  catalog: string,
  namespace: string,
  table: string,
  snapshotId: string | number,
  manifestIndex: number
): Promise<{
  manifest_path: string
  files: any[]
}> {
  const response = await fetch(
    `/api/manifest/${catalog}/${namespace}/${table}/${snapshotId}/${manifestIndex}`
  )
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}

/**
 * Get detailed information about tables in a namespace
 */
export interface NamespaceTable {
  name: string
  formatVersion: string
  dataSizeBytes: number | null
  partitionSpecs: PartitionSpec[]
  lastUpdated: number
}

export async function getNamespaceTables(
  catalog: string,
  namespace: string
): Promise<NamespaceTable[]> {
  const api = catalogApi(catalog)
  const response = await api.v1.listTables(namespace)
  return (await Promise.all(
    response.identifiers?.map(async (table) => {
      const tableResponse = await api.v1.loadTable(namespace, table.name)
      return {
        name: table.name,
        formatVersion: tableResponse.metadata["format-version"] || "",
        dataSizeBytes:
          tableResponse.metadata.statistics?.[0]?.["file-size-in-bytes"] ||
          null,
        partitionSpecs: tableResponse.metadata["partition-specs"] || [],
        lastUpdated: tableResponse.metadata["last-updated-ms"] || 0,
      }
    }) || []
  )) as NamespaceTable[]
}

export interface DistributionItem {
  count: number
  percentage: number
}

export interface DistributionData {
  ranges: {
    [range: string]: DistributionItem
  }
  dataFileCount: number
  positionDeleteFileCount: number
  eqDeleteFileCount: number
  dataFileSizeInBytes: number
  positionDeleteFileSizeInBytes: number
  eqDeleteFileSizeInBytes: number
  dataFileRecordCount: number
  positionDeleteFileRecordCount: number
  eqDeleteFileRecordCount: number
}

/**
 * Get file size distribution for a table, optionally at a specific snapshot
 */
export async function getFileDistribution(
  catalog: string,
  namespace: string,
  tableId: string,
  snapshotId?: string
): Promise<DistributionData> {
  const url = snapshotId
    ? `/api/distribution/${catalog}/${namespace}/${tableId}/${snapshotId}`
    : `/api/distribution/${catalog}/${namespace}/${tableId}`

  const response = await fetch(url)
  if (response.ok) {
    return await response.json()
  }
  return {
    ranges: {
      "0-8M": { count: 0, percentage: 0 },
      "8M-32M": { count: 0, percentage: 0 },
      "32M-128M": { count: 0, percentage: 0 },
      "128M-512M": { count: 0, percentage: 0 },
      "512M+": { count: 0, percentage: 0 },
    },
    dataFileCount: 0,
    positionDeleteFileCount: 0,
    eqDeleteFileCount: 0,
    dataFileSizeInBytes: 0,
    positionDeleteFileSizeInBytes: 0,
    eqDeleteFileSizeInBytes: 0,
    dataFileRecordCount: 0,
    positionDeleteFileRecordCount: 0,
    eqDeleteFileRecordCount: 0,
  }
}

export type OptimizationOperation = "Compaction" | "Snapshot Expiration"

export interface OptimizationSettings {
  snapshotRetention: boolean
  retentionPeriod: string
  minSnapshotsToKeep: string
  compaction: boolean
  targetFileSizeBytes?: number
  strategy?: string
  sortOrder?: string
  whereClause?: string
}

/**
 * Run an optimization operation on a table
 */
export async function runOptimizationOperation(
  step: OptimizationOperation,
  catalog: string,
  namespace: string,
  table: string,
  settings: OptimizationSettings
): Promise<any> {
  const operation =
    step === "Compaction"
      ? "compact"
      : step === "Snapshot Expiration"
        ? "expire-snapshots"
        : "clean-orphan-files"

  const response = await fetch(
    `/api/optimize/${catalog}/${namespace}/${table}/${operation}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snapshotRetention: settings?.snapshotRetention,
        retentionPeriod:
          parseInt(settings.retentionPeriod) * 24 * 60 * 60 * 1000,
        minSnapshotsToKeep: parseInt(settings.minSnapshotsToKeep),
        compaction: settings.compaction,
        targetFileSizeBytes: settings.targetFileSizeBytes,
        strategy: settings.strategy,
        sortOrder: settings.sortOrder,
        whereClause: settings.whereClause,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to run ${step}`)
  }

  return await response.json()
}

/**
 * Schedule optimization operations for a table
 */
export async function scheduleOptimization(
  catalog: string,
  namespace: string,
  table: string,
  settings: OptimizationSettings
): Promise<void> {
  const response = await fetch(
    `/api/optimize/${catalog}/${namespace}/${table}/schedule`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snapshotRetention: settings.snapshotRetention,
        retentionPeriod:
          parseInt(settings.retentionPeriod) * 24 * 60 * 60 * 1000,
        minSnapshotsToKeep: parseInt(settings.minSnapshotsToKeep),
        compaction: settings.compaction,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to schedule optimization")
  }
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
  // First, get the total count of rows
  const countQuery = `SELECT COUNT(*) as total FROM \`${catalog}\`.\`${namespace}\`.\`${table}\``
  const countResult = await runQuery(countQuery)

  // Extract the total count from the result
  const totalRows =
    countResult.rows.length > 0 ? parseInt(countResult.rows[0][0]) : 0
  const totalPages = Math.ceil(totalRows / pagination.pageSize)

  // Calculate offset for pagination
  const offset = (pagination.page - 1) * pagination.pageSize

  // Construct the paginated query
  const query = `SELECT * FROM \`${catalog}\`.\`${namespace}\`.\`${table}\` LIMIT ${pagination.pageSize} OFFSET ${offset}`
  const result = await runQuery(query)

  return {
    columns: result.columns,
    rows: result.rows,
    totalRows,
    totalPages,
  }
}
