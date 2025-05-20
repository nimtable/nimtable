import { streamObject } from "ai"
import { model, systemPrompt } from "@/lib/agent/utils"
import { z } from "zod"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// API for `useObject`
export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })

    const result = streamObject({
      model: model,
      schema: schema,
      system: systemPrompt(),
      // tools: tools(),
      messages,
      // maxSteps: 10,
      onError: (error) => {
        console.error("Chat API error:", error)
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
