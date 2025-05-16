import { streamText, tool, ToolSet } from "ai"
import { z } from "zod"

import { model } from "@/lib/agent/utils"
import { loadNamespacesAndTables } from "@/lib/data-loader"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export const basicSystemPrompt = `
You are Nimtable Copilot, an AI assistant expert in Apache Iceberg.
`
export function systemPrompt(): string {
  return basicSystemPrompt
}

export function tools(): ToolSet {
  return {
    weather: tool({
      description: "Get the weather in a location",
      parameters: z.object({
        location: z.string().describe("The location to get the weather for"),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
    listTables: tool({
      description: "List all tables in a catalog",
      parameters: z.object({
        catalog: z.string().describe("The iceberg catalog to list tables from"),
      }),
      execute: async ({ catalog }) => {
        console.log(`listing tables for catalog: ${catalog}`)
        try {
          const tables = await loadNamespacesAndTables(catalog)
          console.log(`tables: ${JSON.stringify(tables, null, 2)}`)
          return tables
        } catch (error) {
          console.error("Error listing tables:", error)
          return { error: JSON.stringify(error) }
        }
      },
    }),
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: model,
      system: systemPrompt(),
      tools: tools(),
      messages,
      maxSteps: 10,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}
