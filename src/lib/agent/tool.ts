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
