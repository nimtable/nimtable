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

import { NextRequest, NextResponse } from "next/server"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText } from "ai"
import { verifyToken } from "@/lib/auth"
import { AUTH_COOKIE_NAME } from "../../../acc-api/const"
import { db } from "@/db/db"
import { aiSettings } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, modelName } = body
    let { apiKey } = body

    // Validate required fields
    if (!endpoint || !modelName) {
      return NextResponse.json(
        { error: "Endpoint and model name are required" },
        { status: 400 }
      )
    }

    // If no API key provided, get existing one from database
    if (apiKey === undefined) {
      try {
        const userSettings = await db
          .select()
          .from(aiSettings)
          .where(eq(aiSettings.userId, Number(payload.id)))
          .limit(1)

        if (userSettings.length > 0 && userSettings[0].apiKey) {
          apiKey = userSettings[0].apiKey
        } else {
          return NextResponse.json({
            success: false,
            message: "No API key configured for testing",
          })
        }
      } catch (dbError) {
        console.error("Failed to fetch API key from database:", dbError)
        return NextResponse.json({
          success: false,
          message: "Failed to fetch API key configuration",
        })
      }
    }

    // Test the AI endpoint with a simple request
    try {
      const provider = createOpenAICompatible({
        name: "test-connection",
        baseURL: endpoint,
        apiKey: apiKey || undefined,
      })

      const model = provider(modelName)

      // Make a simple test request
      const result = await generateText({
        model: model,
        prompt: "Say 'Hello' to test this connection.",
        maxTokens: 10,
      })

      // If we get here, the connection worked
      return NextResponse.json({
        success: true,
        message: "Connection successful!",
        response: result.text,
        usage: {
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
          totalTokens: result.usage?.totalTokens || 0,
        },
      })
    } catch (aiError: any) {
      console.error("AI connection test failed:", aiError)

      // Parse different types of errors to provide meaningful feedback
      let errorMessage = "Connection failed"

      if (aiError.message) {
        if (
          aiError.message.includes("401") ||
          aiError.message.includes("Unauthorized")
        ) {
          errorMessage = "Invalid API key"
        } else if (
          aiError.message.includes("404") ||
          aiError.message.includes("Not Found")
        ) {
          errorMessage = "Invalid endpoint or model not found"
        } else if (aiError.message.includes("429")) {
          errorMessage = "Rate limit exceeded"
        } else if (
          aiError.message.includes("network") ||
          aiError.message.includes("ENOTFOUND")
        ) {
          errorMessage = "Network error - check endpoint URL"
        } else if (aiError.message.includes("timeout")) {
          errorMessage = "Connection timeout"
        } else {
          errorMessage = `Connection failed: ${aiError.message}`
        }
      }

      return NextResponse.json({
        success: false,
        message: errorMessage,
        error: aiError.message,
      })
    }
  } catch (error) {
    console.error("Error testing AI connection:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
