/*
 * Copyright 2026 Nimtable
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

type ErrorResponse = {
  error?: unknown
  message?: unknown
}

function errorMessage(body: unknown): string | undefined {
  if (typeof body === "string") {
    return body.trim() || undefined
  }

  if (body && typeof body === "object") {
    const { error, message } = body as ErrorResponse
    if (typeof message === "string" && message.trim()) {
      return message
    }
    if (typeof error === "string" && error.trim()) {
      return error
    }
  }

  return undefined
}

export async function readOptimizationResponse(
  response: Response,
  operation: string
): Promise<unknown> {
  const responseText = await response.text()
  let body: unknown

  if (responseText) {
    try {
      body = JSON.parse(responseText)
    } catch {
      body = responseText
    }
  }

  if (!response.ok) {
    const fallback = response.statusText
      ? `Failed to run ${operation}: ${response.status} ${response.statusText}`
      : `Failed to run ${operation}: HTTP ${response.status}`
    throw new Error(errorMessage(body) || fallback)
  }

  if (responseText && typeof body === "string") {
    throw new Error(`Invalid response while running ${operation}: ${body}`)
  }

  return body
}
