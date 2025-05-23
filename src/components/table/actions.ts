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

"use server"

import { saveTableSummary } from "@/db/db"
import { model, systemPrompt } from "@/lib/agent/utils"
import { TableMetadata } from "@/lib/api"
import { DistributionData } from "@/lib/data-loader"
import { generateText } from "ai"

type TableInfo = {
  catalog: string
  namespace: string
  table: string
  fileDistribution: DistributionData
  /**
   * We pass only part of TableMetadata, e.g., avoid full snapshot history list
   */
  metadata: TableMetadata
  lastUpdatedTime: string
}

export async function actionGenerateTableSummary(tableData: TableInfo) {
  const data = JSON.stringify(tableData)
  console.log("Generating table summary", data)
  const prompt = `
Draft a concise, business-oriented summary of the table data supplied below.

## What to cover
- Business purpose of the table and its most important metrics/columns
- Row count, time span covered, last-updated timestamp (freshness)
- Partition strategy & primary/business keys, if any
- Notable data-quality signals (null/skew/duplicates)
- One actionable insight or potential risk the audience should know

## Style & format
- Plain text. Split sections into multiple paragraphs when necessary.
- No headings, disclaimers, apologies, or filenames—return *only* the summary text
- If critical details are missing in the input, state that briefly (e.g. “Row count not provided”).

## Table Data

${data}

## Current Time

${new Date().toLocaleString()}
`

  const { text } = await generateText({
    model: model,
    system: systemPrompt(),
    prompt: prompt,
  })
  console.log("Generated table summary", text)

  await saveTableSummary({
    catalogName: tableData.catalog,
    namespace: tableData.namespace,
    tableName: tableData.table,
    summary: text,
    createdBy: "agent",
  })

  return text
}
