import { openai } from "@ai-sdk/openai"
import type {
  LanguageModel,
  LanguageModelV1Middleware,
  LanguageModelV1StreamPart,
} from "ai"
import { wrapLanguageModel } from "ai"

export const logMiddleware: LanguageModelV1Middleware = {
  wrapStream: async ({ doStream, params }) => {
    console.log("doStream called")
    console.log(`params: ${JSON.stringify(params, null, 2)}`)

    const { stream, ...rest } = await doStream()

    const chunks: LanguageModelV1StreamPart[] = []

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        if (chunk.type === "text-delta") {
          chunks.push(chunk)
        }

        controller.enqueue(chunk)
      },

      flush() {
        console.log("doStream finished")
        console.log(`generated: ${JSON.stringify(chunks, null, 2)}`)
      },
    })

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    }
  },
}

export const model: LanguageModel = (() => {
  if (process.env.NODE_ENV === "development") {
    return wrapLanguageModel({
      model: openai("gpt-4.1-mini"),
      middleware: logMiddleware,
    })
  } else {
    return openai("gpt-4.1-mini")
  }
})()
