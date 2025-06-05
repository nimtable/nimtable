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

import { tool } from "ai"
import { ToolSet } from "ai"
import { z } from "zod"
import {
  loadNamespacesAndTables,
  loadCatalogNames,
  listNamespaces,
  loadTableData,
  runQuery,
  getManifestList,
  getManifestDetails,
  getFileDistribution,
} from "../data-loader"

export function tools(): ToolSet {
  const tools: ToolSet = {}

  tools.getCatalogs = tool({
    description: "Get list of all available Iceberg catalogs",
    parameters: z.object({}),
    execute: async () => {
      console.log("Getting catalogs")
      try {
        const catalogs = await loadCatalogNames()
        console.log(`catalogs: ${JSON.stringify(catalogs, null, 2)}`)
        return { catalogs }
      } catch (error) {
        console.error("Error getting catalogs:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  tools.getNamespaces = tool({
    description: "Get list of all namespaces in a specific catalog",
    parameters: z.object({
      catalog: z
        .string()
        .describe("The iceberg catalog to list namespaces from"),
    }),
    execute: async ({ catalog }) => {
      console.log(`Getting namespaces for catalog: ${catalog}`)
      try {
        const namespaces = await listNamespaces(catalog)
        console.log(`namespaces: ${JSON.stringify(namespaces, null, 2)}`)
        return { namespaces }
      } catch (error) {
        console.error("Error getting namespaces:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  tools.getTables = tool({
    description:
      "Get list of all tables in a catalog with their structure and metadata",
    parameters: z.object({
      catalog: z.string().describe("The iceberg catalog to list tables from"),
    }),
    execute: async ({ catalog }) => {
      console.log(`Getting tables for catalog: ${catalog}`)
      try {
        const tables = await loadNamespacesAndTables(catalog, false)
        console.log(`tables: ${JSON.stringify(tables, null, 2)}`)
        return { tables }
      } catch (error) {
        console.error("Error getting tables:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  tools.getTableSchema = tool({
    description:
      "Get detailed schema information for a specific table including columns, data types, partitions",
    parameters: z.object({
      catalog: z.string().describe("The iceberg catalog name"),
      namespace: z.string().describe("The namespace name"),
      table: z.string().describe("The table name"),
    }),
    execute: async ({ catalog, namespace, table }) => {
      console.log(`Getting table schema for: ${catalog}.${namespace}.${table}`)
      try {
        const tableData = await loadTableData(catalog, namespace, table)

        // Find the current schema from schemas array using current-schema-id
        const currentSchemaId = tableData.metadata["current-schema-id"]
        const currentSchema = tableData.metadata.schemas?.find(
          (schema) => schema["schema-id"] === currentSchemaId
        )

        const schema = {
          table: `${catalog}.${namespace}.${table}`,
          columns: currentSchema?.fields || [],
          partitionSpecs: tableData.metadata["partition-specs"] || [],
          sortOrders: tableData.metadata["sort-orders"] || [],
          formatVersion: tableData.metadata["format-version"],
          tableUuid: tableData.metadata["table-uuid"],
          location: tableData.metadata.location,
          properties: tableData.metadata.properties,
        }
        console.log(`table schema: ${JSON.stringify(schema, null, 2)}`)
        return schema
      } catch (error) {
        console.error("Error getting table schema:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  tools.getTableMetadata = tool({
    description:
      "Get complete table metadata including snapshots, history, statistics, and configuration details",
    parameters: z.object({
      catalog: z.string().describe("The iceberg catalog name"),
      namespace: z.string().describe("The namespace name"),
      table: z.string().describe("The table name"),
    }),
    execute: async ({ catalog, namespace, table }) => {
      console.log(`Getting table metadata for: ${catalog}.${namespace}.${table}`)
      try {
        const tableData = await loadTableData(catalog, namespace, table)
        
        const metadata = {
          table: `${catalog}.${namespace}.${table}`,
          formatVersion: tableData.metadata["format-version"],
          tableUuid: tableData.metadata["table-uuid"],
          location: tableData.metadata.location,
          lastUpdated: tableData.metadata["last-updated-ms"],
          currentSnapshotId: tableData.metadata["current-snapshot-id"],
          lastSequenceNumber: tableData.metadata["last-sequence-number"],
          properties: tableData.metadata.properties,
          schemas: tableData.metadata.schemas || [],
          currentSchemaId: tableData.metadata["current-schema-id"],
          partitionSpecs: tableData.metadata["partition-specs"] || [],
          defaultSpecId: tableData.metadata["default-spec-id"],
          sortOrders: tableData.metadata["sort-orders"] || [],
          defaultSortOrderId: tableData.metadata["default-sort-order-id"],
          snapshots: tableData.metadata.snapshots || [],
          snapshotLog: tableData.metadata["snapshot-log"] || [],
          metadataLog: tableData.metadata["metadata-log"] || [],
          refs: tableData.metadata.refs || {},
          statistics: tableData.metadata.statistics || [],
          partitionStatistics: tableData.metadata["partition-statistics"] || [],
        }
        console.log(`table metadata: ${JSON.stringify(metadata, null, 2)}`)
        return metadata
      } catch (error) {
        console.error("Error getting table metadata:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  tools.getTableSnapshots = tool({
    description:
      "Get detailed information about all snapshots for a table including operation types, timestamps, and summary statistics",
    parameters: z.object({
      catalog: z.string().describe("The iceberg catalog name"),
      namespace: z.string().describe("The namespace name"),
      table: z.string().describe("The table name"),
    }),
    execute: async ({ catalog, namespace, table }) => {
      console.log(`Getting snapshots for: ${catalog}.${namespace}.${table}`)
      try {
        const tableData = await loadTableData(catalog, namespace, table)
        
        const snapshots = (tableData.metadata.snapshots || []).map(snapshot => ({
          snapshotId: snapshot["snapshot-id"],
          parentSnapshotId: snapshot["parent-snapshot-id"],
          sequenceNumber: snapshot["sequence-number"],
          timestampMs: snapshot["timestamp-ms"],
          operation: snapshot.summary?.operation || "unknown",
          summary: snapshot.summary || {},
          manifestList: snapshot["manifest-list"],
          schemaId: snapshot["schema-id"],
        }))

        const refs = Object.entries(tableData.metadata.refs || {}).map(([name, ref]) => ({
          name,
          type: ref.type,
          snapshotId: ref["snapshot-id"],
          maxRefAgeMs: ref["max-ref-age-ms"],
          maxSnapshotAgeMs: ref["max-snapshot-age-ms"],
          minSnapshotsToKeep: ref["min-snapshots-to-keep"],
        }))

        const result = {
          table: `${catalog}.${namespace}.${table}`,
          currentSnapshotId: tableData.metadata["current-snapshot-id"],
          snapshots,
          refs,
          snapshotLog: tableData.metadata["snapshot-log"] || [],
          totalSnapshots: snapshots.length,
        }
        console.log(`table snapshots: ${JSON.stringify(result, null, 2)}`)
        return result
      } catch (error) {
        console.error("Error getting table snapshots:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  tools.getSnapshotManifests = tool({
    description:
      "Get manifest list and details for a specific snapshot, showing data and delete files",
    parameters: z.object({
      catalog: z.string().describe("The iceberg catalog name"),
      namespace: z.string().describe("The namespace name"),
      table: z.string().describe("The table name"),
      snapshotId: z.string().describe("The snapshot ID to get manifests for"),
    }),
    execute: async ({ catalog, namespace, table, snapshotId }) => {
      console.log(`Getting manifests for snapshot ${snapshotId} in: ${catalog}.${namespace}.${table}`)
      try {
        const manifestList = await getManifestList(catalog, namespace, table, snapshotId)
        
        const result = {
          table: `${catalog}.${namespace}.${table}`,
          snapshotId: manifestList.snapshot_id,
          manifestListLocation: manifestList.manifest_list_location,
          manifests: manifestList.manifests.map((manifest, index) => ({
            index,
            path: manifest.path,
            length: manifest.length,
            partitionSpecId: manifest.partition_spec_id,
            content: manifest.content,
            sequenceNumber: manifest.sequence_number,
            minSequenceNumber: manifest.min_sequence_number,
            addedSnapshotId: manifest.added_snapshot_id,
            addedDataFilesCount: manifest.added_data_files_count,
            existingDataFilesCount: manifest.existing_data_files_count,
            deletedDataFilesCount: manifest.deleted_data_files_count,
            addedRecords: manifest.added_rows_count,
            existingRecords: manifest.existing_rows_count,
            deletedRecords: manifest.deleted_rows_count,
            keyMetadata: manifest.key_metadata,
          })),
          totalManifests: manifestList.manifests.length,
        }
        console.log(`snapshot manifests: ${JSON.stringify(result, null, 2)}`)
        return result
      } catch (error) {
        console.error("Error getting snapshot manifests:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  tools.getManifestFiles = tool({
    description:
      "Get detailed file information from a specific manifest, including data files or delete files",
    parameters: z.object({
      catalog: z.string().describe("The iceberg catalog name"),
      namespace: z.string().describe("The namespace name"),
      table: z.string().describe("The table name"),
      snapshotId: z.string().describe("The snapshot ID"),
      manifestIndex: z.number().describe("The index of the manifest in the manifest list (0-based)"),
    }),
    execute: async ({ catalog, namespace, table, snapshotId, manifestIndex }) => {
      console.log(`Getting files for manifest ${manifestIndex} in snapshot ${snapshotId} of: ${catalog}.${namespace}.${table}`)
      try {
        const manifestDetails = await getManifestDetails(catalog, namespace, table, snapshotId, manifestIndex)
        
        const result = {
          table: `${catalog}.${namespace}.${table}`,
          snapshotId,
          manifestIndex,
          manifestPath: manifestDetails.manifest_path,
          files: manifestDetails.files.map(file => ({
            filePath: file.file_path || file.path,
            fileFormat: file.file_format || file.format,
            partitions: file.partition || {},
            recordCount: file.record_count,
            fileSizeInBytes: file.file_size_in_bytes,
            columnSizes: file.column_sizes || {},
            valueCounts: file.value_counts || {},
            nullValueCounts: file.null_value_counts || {},
            nanValueCounts: file.nan_value_counts || {},
            lowerBounds: file.lower_bounds || {},
            upperBounds: file.upper_bounds || {},
            keyMetadata: file.key_metadata,
            splitOffsets: file.split_offsets || [],
            sortOrderId: file.sort_order_id,
            // Delete file specific fields
            content: file.content,
            referencedDataFile: file.referenced_data_file,
          })),
          totalFiles: manifestDetails.files.length,
        }
        console.log(`manifest files: ${JSON.stringify(result, null, 2)}`)
        return result
      } catch (error) {
        console.error("Error getting manifest files:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  tools.getFileDistribution = tool({
    description:
      "Get file size distribution statistics for a table, optionally for a specific snapshot",
    parameters: z.object({
      catalog: z.string().describe("The iceberg catalog name"),
      namespace: z.string().describe("The namespace name"),
      table: z.string().describe("The table name"),
      snapshotId: z.string().optional().describe("Optional snapshot ID to get distribution for specific snapshot"),
    }),
    execute: async ({ catalog, namespace, table, snapshotId }) => {
      console.log(`Getting file distribution for: ${catalog}.${namespace}.${table}${snapshotId ? ` at snapshot ${snapshotId}` : ''}`)
      try {
        const distribution = await getFileDistribution(catalog, namespace, table, snapshotId)
        
        const result = {
          table: `${catalog}.${namespace}.${table}`,
          snapshotId: snapshotId || "current",
          fileSizeRanges: distribution.ranges,
          dataFileCount: distribution.dataFileCount,
          positionDeleteFileCount: distribution.positionDeleteFileCount,
          eqDeleteFileCount: distribution.eqDeleteFileCount,
          dataFileSizeInBytes: distribution.dataFileSizeInBytes,
          positionDeleteFileSizeInBytes: distribution.positionDeleteFileSizeInBytes,
          eqDeleteFileSizeInBytes: distribution.eqDeleteFileSizeInBytes,
          dataFileRecordCount: distribution.dataFileRecordCount,
          positionDeleteFileRecordCount: distribution.positionDeleteFileRecordCount,
          eqDeleteFileRecordCount: distribution.eqDeleteFileRecordCount,
          totalFiles: distribution.dataFileCount + distribution.positionDeleteFileCount + distribution.eqDeleteFileCount,
          totalSizeInBytes: distribution.dataFileSizeInBytes + distribution.positionDeleteFileSizeInBytes + distribution.eqDeleteFileSizeInBytes,
        }
        console.log(`file distribution: ${JSON.stringify(result, null, 2)}`)
        return result
      } catch (error) {
        console.error("Error getting file distribution:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  tools.executeSQL = tool({
    description:
      "Execute a Spark SQL query against Iceberg tables and return results. Use proper Spark SQL syntax with backticks for table references like `catalog`.`namespace`.`table`",
    parameters: z.object({
      query: z.string().describe("The Spark SQL query to execute"),
    }),
    execute: async ({ query }) => {
      console.log(`Executing SQL query: ${query}`)
      try {
        const result = await runQuery(query)
        if (result.error) {
          console.error("SQL query error:", result.error)
          return { error: result.error }
        }
        console.log(`query result: ${JSON.stringify(result, null, 2)}`)
        return {
          columns: result.columns,
          rows: result.rows,
          rowCount: result.rows.length,
        }
      } catch (error) {
        console.error("Error executing SQL:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  // Legacy tool name for backward compatibility
  tools.listTables = tools.getTables

  return tools
}
