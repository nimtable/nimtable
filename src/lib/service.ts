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
import { toast } from "@/hooks/use-toast"
import { getApiBaseUrl } from "./api-config"

client.setConfig({
  baseUrl: getApiBaseUrl(),
  credentials: "include",
  throwOnError: true,
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
  return response
})
export const service = client
