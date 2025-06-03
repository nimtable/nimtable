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

import { streamText } from "ai"
import { model, systemPrompt, tools } from "@/lib/agent/utils"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: model,
      system: `${systemPrompt()}

You are an expert in Apache Iceberg and Spark SQL. Help users explore their data lake by:

1. **Data Discovery**: Use tools to explore catalogs, namespaces, and tables
2. **Schema Analysis**: Get table schemas and explain column structures  
3. **Query Generation**: Write optimized Spark SQL queries using proper syntax with backticks for table references
4. **Data Insights**: Provide meaningful analysis of query results

## Important Guidelines:
- Always use backticks for table references in SQL: \`catalog\`.\`namespace\`.\`table\`
- Use proper Spark SQL syntax and functions
- Explain what you're doing and why
- Be conversational and helpful
- If a query fails, suggest alternatives or explain the issue
- When showing data, provide context and insights

## Available Tools:
- getCatalogs: List all available catalogs
- getNamespaces: List namespaces in a catalog  
- getTables: List tables in a catalog with metadata
- getTableSchema: Get detailed schema for a specific table
- executeSQL: Run Spark SQL queries against Iceberg tables

Always start by understanding what data is available before writing queries.`,
      messages,
      tools: tools(),
      maxSteps: 5,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in AI chat endpoint:", error)
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 