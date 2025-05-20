import { streamText } from "ai"
import { errorHandler, model, systemPrompt, tools } from "@/lib/agent/utils"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// API for `useChat`
export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: model,
      system: systemPrompt(),
      tools: tools(),
      messages,
      maxSteps: 10,
      onError: (error) => {
        console.error("Chat API error:", error)
      },
    })

    return result.toDataStreamResponse({ getErrorMessage: errorHandler })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
