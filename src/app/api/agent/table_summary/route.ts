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

import { getLatestTableSummary } from "@/db/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const table = searchParams.get("table")
  const namespace = searchParams.get("namespace")
  const catalog = searchParams.get("catalog")

  if (!table || !namespace || !catalog) {
    return Response.json(
      { error: "Missing table, namespace, or catalog" },
      { status: 400 }
    )
  }

  const tableSummary = await getLatestTableSummary({
    catalogName: catalog,
    namespace: namespace,
    tableName: table,
  })

  if (!tableSummary) {
    return Response.json({ error: "Table summary not found" }, { status: 404 })
  }

  return Response.json(tableSummary, { status: 200 })
}
