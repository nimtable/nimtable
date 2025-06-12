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

import { client } from "./client/client.gen"
import { client as accClient } from "./acc-api/client/client.gen"
import { toast } from "@/hooks/use-toast"
import { getApiBaseUrl } from "./api-config"

// Handle 401 response
const handleUnauthorized = async () => {
  try {
    // Only redirect if not already on login page
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login"
    }
  } catch (error) {
    console.error("Logout failed:", error)
  }
}

accClient.setConfig({
  credentials: "include",
  throwOnError: true,
})

client.setConfig({
  baseUrl: getApiBaseUrl(),
  credentials: "include",
  throwOnError: true,
})

accClient.interceptors.response.use(async (response) => {
  const ContentType = response.headers.get("Content-Type")
  if (ContentType?.startsWith("text/plain") && !response.ok) {
    const message = await response.clone().text()
    toast({
      title: "Error",
      description: message,
    })
  }
  if (response.status === 401) {
    await handleUnauthorized()
  }
  return response
})

client.interceptors.response.use(async (response) => {
  const ContentType = response.headers.get("Content-Type")
  if (ContentType?.startsWith("text/plain") && !response.ok) {
    const message = await response.clone().text()
    toast({
      title: "Error",
      description: message,
    })
  }
  if (response.status === 401) {
    await handleUnauthorized()
  }
  return response
})

export const service = client
