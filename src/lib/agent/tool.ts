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
import { loadNamespacesAndTables } from "../data-loader"

export function tools(): ToolSet {
  const tools: ToolSet = {}

  tools.listTables = tool({
    description: "List all tables in a catalog",
    parameters: z.object({
      catalog: z.string().describe("The iceberg catalog to list tables from"),
    }),
    execute: async ({ catalog }) => {
      console.log(`listing tables for catalog: ${catalog}`)
      try {
        const tables = await loadNamespacesAndTables(catalog, false)
        console.log(`tables: ${JSON.stringify(tables, null, 2)}`)
        return tables
      } catch (error) {
        console.error("Error listing tables:", error)
        return { error: JSON.stringify(error) }
      }
    },
  })

  return tools
}
