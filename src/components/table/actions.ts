"use server"

import { model, systemPrompt } from "@/lib/agent/utils"
import { TableMetadata } from "@/lib/api"
import { DistributionData } from "@/lib/data-loader"
import { generateText } from "ai"

type TableInfo = {
  qualifiedName: string
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

  return text
}
