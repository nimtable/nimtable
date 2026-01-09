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

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getJavaApiBaseUrl } from "./lib/api-config"
import { jwtVerify } from "jose"
import { AUTH_COOKIE_NAME } from "./app/acc-api/const"

const JWT_SECRET = process.env.JWT_SECRET || ""

// List of paths that don't require authentication
const PUBLIC_PATHS = ["/acc-api/auth/login", "/acc-api/auth/logout", "/login"]

// Helper function to clear auth cookie
const clearAuthCookie = (response: NextResponse) => {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 0, // Set to 0 to expire immediately
  })
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and image files
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|bmp|avif)$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Check if it's a public path
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // Check if it's an acc-api path
  if (pathname.startsWith("/acc-api/")) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided", status: 401 },
        { status: 401 }
      )
    }

    try {
      // Verify token using jose
      const secret = new TextEncoder().encode(JWT_SECRET)
      jwtVerify(token, secret)
      return NextResponse.next()
    } catch (error) {
      console.log("token verification error", error)
      const response = NextResponse.json(
        { error: "Unauthorized - Invalid token", status: 401 },
        { status: 401 }
      )
      return clearAuthCookie(response)
    }
  }

  // Check if the request path starts with /api/ (exclude Next.js API routes)
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/agent/") &&
    !pathname.startsWith("/api/ai-settings")
  ) {
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

  // For all other paths, check authentication
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verify token using jose
    const secret = new TextEncoder().encode(JWT_SECRET)
    jwtVerify(token, secret)
    return NextResponse.next()
  } catch (_error) {
    console.log("token verification error, redirecting to login")
    const loginUrl = new URL("/login", request.url)
    const response = NextResponse.redirect(loginUrl)
    return clearAuthCookie(response)
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    "/api/:path*",
    "/acc-api/:path*",
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
}
