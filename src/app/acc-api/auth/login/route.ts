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

import { NextRequest, NextResponse } from "next/server"
import { sign } from "jsonwebtoken"
import { compare, hash } from "bcryptjs"
import { db } from "@/lib/db"
import { LoginResponse } from "@/lib/acc-api/client/types.gen"
import { AUTH_COOKIE_NAME } from "../../const"

const JWT_SECRET = process.env.JWT_SECRET || ""
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || ""
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { username },
      include: { roles: true },
    })

    if (user) {
      // Verify password
      const isValidPassword = await compare(password, user.password_hash)

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid username or password" },
          { status: 403 }
        )
      }

      // Generate JWT token
      const token = sign(
        {
          id: user.id.toString(),
          username: user.username,
          role: user.roles.name,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      )

      // Create response with user data
      const response = NextResponse.json<LoginResponse>({
        success: true,
        token: token,
      })

      // Set cookie in response
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
      })

      return response
    }

    // Check if superadmin user exists in database, if not create it
    let superAdminUser = await db.user.findFirst({
      where: { roles: { name: "superadmin" } },
      include: { roles: true },
    })

    if (!superAdminUser) {
      // Find superadmin role
      const superAdminRole = await db.role.findFirst({
        where: { name: "superadmin" },
      })

      if (!superAdminRole) {
        return NextResponse.json(
          { error: "Superadmin role not found in database" },
          { status: 500 }
        )
      }

      superAdminUser = await db.user.create({
        data: {
          username: ADMIN_USERNAME,
          password_hash: await hash(ADMIN_PASSWORD, 10), // Hash the password
          role_id: superAdminRole.id,
        },
        include: { roles: true },
      })
    }

    // Verify password for superadmin user
    const isValidPassword = await compare(
      password,
      superAdminUser.password_hash
    )

    if (isValidPassword) {
      const token = sign(
        {
          id: superAdminUser.id.toString(),
          username: superAdminUser.username,
          role: superAdminUser.roles.name,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      )

      console.log("JWT_SECRET", JWT_SECRET)

      const response = NextResponse.json<LoginResponse>({
        success: true,
        token: token,
      })
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
      })
      return response
    }

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 403 }
    )
  } catch (error) {
    console.error("Login error details:", error)
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    )
  }
}
