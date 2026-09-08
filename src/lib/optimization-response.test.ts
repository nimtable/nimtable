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

import assert from "node:assert/strict"
import test from "node:test"

import { readOptimizationResponse } from "./optimization-response"

test("returns a successful JSON response", async () => {
  const response = new Response('{"rewrittenDataFilesCount":2}')

  assert.deepEqual(await readOptimizationResponse(response, "Compaction"), {
    rewrittenDataFilesCount: 2,
  })
})

test("preserves a JSON error message", async () => {
  const response = new Response(
    '{"message":"Polaris rejected the table commit"}',
    { status: 500 }
  )

  await assert.rejects(
    readOptimizationResponse(response, "Compaction"),
    /Polaris rejected the table commit/
  )
})

test("preserves a plain-text proxy error", async () => {
  const response = new Response("Internal Server Error", { status: 500 })

  await assert.rejects(
    readOptimizationResponse(response, "Snapshot Expiration"),
    /Internal Server Error/
  )
})

test("uses the HTTP status for an empty error response", async () => {
  const response = new Response(null, {
    status: 503,
    statusText: "Service Unavailable",
  })

  await assert.rejects(
    readOptimizationResponse(response, "Compaction"),
    /Failed to run Compaction: 503 Service Unavailable/
  )
})
