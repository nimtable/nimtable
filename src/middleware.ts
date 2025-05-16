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

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getJavaApiBaseUrl } from "./lib/api-config"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the request path starts with /api/
  if (pathname.startsWith("/api/")) {
    const javaApiBaseUrl = getJavaApiBaseUrl()
    if (!javaApiBaseUrl) {
      return NextResponse.json(
        { error: "JAVA_API_URL is not set" },
        { status: 500 }
      )
    }
    const destination = `${javaApiBaseUrl}${pathname}${request.nextUrl.search}`
    return NextResponse.rewrite(new URL(destination))
  }

  // If no rewrite is needed, continue to the next middleware or route
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: "/api/:path*",
}
