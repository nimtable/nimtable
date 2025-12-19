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
import { db } from "@/db/db"
import { aiSettings } from "@/db/schema"
import { eq } from "drizzle-orm"

export const logMiddleware: LanguageModelV1Middleware = {
  wrapStream: async ({ doStream, params }) => {
    console.log("doStream called")
    console.log(`params: ${JSON.stringify(params, null, 2)}`)

    const streamResult = await doStream()

    const { stream, ...rest } = streamResult

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

async function getUserAIModel(userId?: number): Promise<LanguageModel | null> {
  if (!userId) return null

  try {
    const userSettings = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.userId, userId))
      .limit(1)

    if (userSettings.length === 0 || !userSettings[0].isEnabled) {
      return null
    }

    const settings = userSettings[0]
    const provider = createOpenAICompatible({
      name: "user-custom",
      baseURL: settings.endpoint,
      apiKey: settings.apiKey || undefined,
    })

    return wrapLanguageModel({
      model: provider(settings.modelName),
      middleware: simulateStreamingMiddleware(),
    })
  } catch (error) {
    console.error("Failed to load user AI settings:", error)
    return null
  }
}

export async function getModel(userId?: number): Promise<LanguageModel> {
  // Try to get user's custom AI model first
  const userModel = await getUserAIModel(userId)
  if (userModel) {
    let model = userModel
    if (process.env.NODE_ENV === "development") {
      model = wrapLanguageModel({
        model,
        middleware: logMiddleware,
      })
    }
    return model
  }

  throw new Error(
    "AI is not configured. Please configure AI settings in Settings → AI."
  )
}

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
