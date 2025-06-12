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
import { jwtVerify } from "jose"

interface TokenPayload {
  id: number
  username: string
  role: string
}

function isTokenPayload(payload: unknown): payload is TokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    "username" in payload &&
    "role" in payload &&
    typeof (payload as TokenPayload).id === "string" &&
    typeof (payload as TokenPayload).username === "string" &&
    typeof (payload as TokenPayload).role === "string"
  )
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    )
    const { payload } = await jwtVerify(token, secret)

    if (isTokenPayload(payload)) {
      return payload
    }
    return null
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}
