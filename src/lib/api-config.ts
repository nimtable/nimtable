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

// Configuration for API endpoint that works in both browser and server environments
export const getApiBaseUrl = (inBrowser: boolean = true) => {
  // Browser-side: empty string to use relative URLs
  // Will be handled by nextjs rewrite
  if (inBrowser) {
    return ""
  }

  // Server-side: use environment variable or default to backend service URL
  const javaApiBaseUrl = getJavaApiBaseUrl()
  if (!javaApiBaseUrl) {
    throw new Error("JAVA_API_URL is not set")
  }
  return javaApiBaseUrl
}

export const getJavaApiBaseUrl = () => {
  if (process.env.JAVA_API_URL) {
    return process.env.JAVA_API_URL
  } else if (process.env.NODE_ENV === "development") {
    return "http://localhost:8182"
  } else {
    return null
  }
}
