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

import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
export { systemPrompt } from "./prompt"
export { tools } from "./tool"
import type {
  LanguageModel,
  LanguageModelV1Middleware,
  LanguageModelV1StreamPart,
} from "ai"
import { simulateStreamingMiddleware, wrapLanguageModel } from "ai"

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

const hostedNimtableModel = () => {
  const provider = createOpenAICompatible({
    name: "nimtable",
    baseURL: "https://gvhzsvzxusepnpfcipac.supabase.co/functions/v1/openai",
  })
  // TODO: remove simulateStreamingMiddleware
  return wrapLanguageModel({
    model: provider("gpt-4.1"),
    middleware: simulateStreamingMiddleware(),
  })
}

export const model: LanguageModel = (() => {
  let model = hostedNimtableModel()

  if (process.env.NODE_ENV === "development") {
    model = wrapLanguageModel({
      model,
      middleware: logMiddleware,
    })
  }

  return model
})()

export function errorHandler(error: unknown) {
  if (error == null) {
    return "unknown error"
  }

  if (typeof error === "string") {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  return JSON.stringify(error)
}
