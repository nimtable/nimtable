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
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { verifyToken } from "@/lib/auth"
import { AUTH_COOKIE_NAME } from "../const"

// GET /acc-api/user-info
export async function GET(request: NextRequest) {
  console.log("Get user profile request received")
  try {
    // Get token from cookie
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify token and get user info
    const payload = await verifyToken(token)
    if (!payload) {
      console.log("Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("User profile retrieved successfully")
    return NextResponse.json(payload)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    )
  }
}

// PATCH /acc-api/user-info
export async function PATCH(request: NextRequest) {
  console.log("Update user profile request received")
  try {
    // Get token from cookie
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify token and get user info
    const payload = await verifyToken(token)
    if (!payload || !payload.id) {
      console.log("Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { username, password } = body

    // Validate request data
    if (!username && !password) {
      console.log("No update data provided")
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      )
    }

    // Check username uniqueness if updating username
    if (username) {
      const existingUser = await db.user.findUnique({
        where: { username },
      })
      if (existingUser && existingUser.id !== BigInt(payload.id)) {
        console.log("Username already exists")
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (username) updateData.username = username
    if (password) updateData.password_hash = await hash(password, 10)

    // Update user info
    const updatedUser = await db.user.update({
      where: { id: BigInt(payload.id) },
      data: updateData,
      include: {
        roles: true,
      },
    })

    console.log("User profile updated successfully")
    return NextResponse.json({
      id: Number(updatedUser.id),
      username: updatedUser.username,
      role: updatedUser.roles.name,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    )
  }
}
