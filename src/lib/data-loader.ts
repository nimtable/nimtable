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
import { CatalogConfig, LoadTableResult } from "./api"
import { Api } from "@/lib/api"

// Re-export types from api.ts, ensuring application code don't need to access the api directly.
export type { CatalogConfig, StructField, LoadTableResult } from "./api";

// Types for the sidebar data structure
export interface NamespaceTables {
    name: string // full namespace name
    shortName: string // last part of the namespace name
    tables: string[]
    children: NamespaceTables[]
}

export async function loadCatalogNames(): Promise<string[]> {
    const response = await fetch('/api/catalogs')
    if (!response.ok) {
        throw new Error(`Failed to fetch catalogs: ${response.statusText}`)
    }
    return await response.json()
}

export async function loadNamespacesAndTables(catalog: string): Promise<NamespaceTables[]> {
    const api = new Api({ baseUrl: `/api/catalog/${catalog}` })

    async function fetchNamespaceAndChildren(namespace: string[]): Promise<NamespaceTables> {
        const namespaceName = namespace.join('.')
        const tablesResponse = await api.v1.listTables(namespaceName)

        // Get child namespaces
        const childNamespacesResponse = await api.v1.listNamespaces({ parent: namespaceName })
        const childNamespaces = childNamespacesResponse.namespaces || []

        // Recursively fetch child namespaces
        const children = await Promise.all(
            childNamespaces.map(child => fetchNamespaceAndChildren(child))
        )

        return {
            name: namespaceName,
            shortName: namespace[namespace.length - 1],
            tables: tablesResponse.identifiers?.map((table) => table.name) || [],
            children
        }
    }

    // Start with root namespaces
    const response = await api.v1.listNamespaces()
    const rootNamespaces = response.namespaces || []

    // Fetch all namespaces and their children
    return await Promise.all(
        rootNamespaces.map(namespace => fetchNamespaceAndChildren(namespace))
    )
}

export async function listNamespaces(catalog: string): Promise<string[]> {
    const api = new Api({ baseUrl: `/api/catalog/${catalog}` })

    // Start with root namespaces
    const response = await api.v1.listNamespaces()
    const rootNamespaces = response.namespaces || []
    return rootNamespaces.map((namespace) => namespace.join('.'))
}


export async function getCatalogConfig(catalog: string): Promise<CatalogConfig> {
    const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
    return await api.v1.getConfig()
}

export async function loadTableData(catalog: string, namespace: string, table: string): Promise<LoadTableResult> {
    const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
    const response = await api.v1.loadTable(namespace, table)
    return response
}

export async function dropTable(catalog: string, namespace: string, table: string): Promise<void> {
    const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
    await api.v1.dropTable(namespace, table)
}

export async function renameTable(
    catalog: string,
    namespace: string,
    sourceTable: string,
    destinationTable: string,
): Promise<void> {
    const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
    await api.v1.renameTable({
        source: {
            namespace: namespace.split('/'),
            name: sourceTable
        },
        destination: {
            namespace: namespace.split('/'),
            name: destinationTable
        }
    })
}

export async function runQuery(query: string): Promise<{ columns: string[]; rows: any[][]; error?: string }> {
    const response = await fetch(`/api/query?query=${encodeURIComponent(query)}`)
    return await response.json()
}

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
    const response = await fetch(`/api/manifest/${catalog}/${namespace}/${table}/${snapshotId}`)
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
    manifestIndex: number,
): Promise<{
    manifest_path: string
    files: any[]
}> {
    const response = await fetch(`/api/manifest/${catalog}/${namespace}/${table}/${snapshotId}/${manifestIndex}`)
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
    dataSizeBytes: number
    partitioning: string | null
    lastUpdated: number
}

export async function getNamespaceTables(catalog: string, namespace: string): Promise<NamespaceTable[]> {
    const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
    const response = await api.v1.listTables(namespace)
    return (await Promise.all(response.identifiers?.map(async (table) => {
        const tableResponse = await api.v1.loadTable(namespace, table.name)
        return {
            name: table.name,
            formatVersion: tableResponse.metadata['format-version'] || "",
            dataSizeBytes: tableResponse.metadata.statistics?.[0]?.["file-size-in-bytes"] || 0,
            partitioning: tableResponse.metadata["partition-specs"] || null,
            lastUpdated: tableResponse.metadata['last-updated-ms'] || 0,
        }
    }) || [])) as NamespaceTable[]
}
