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
import { verifyToken } from "@/lib/auth"
import { AUTH_COOKIE_NAME } from "../const"

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || ""

// GET /acc-api/user-info
export async function GET(request: NextRequest) {
  console.log("Get user profile request received")
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      console.log("Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    if (String(payload.id) === "0") {
      // Superadmin user
      return NextResponse.json({
        id: 0,
        username: ADMIN_USERNAME,
        role: "admin",
        profile: null,
        createdAt: null,
        updatedAt: null,
      })
    }
    const user = await db.user.findUnique({
      where: { id: BigInt(payload.id) },
      include: {
        roles: true,
        userProfile: true,
      },
    })
    if (!user) {
      console.log("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    console.log("User profile retrieved successfully")
    return NextResponse.json({
      id: Number(user.id),
      username: user.username,
      role: user.roles.name,
      profile: user.userProfile
        ? {
            first_name: user.userProfile.first_name,
            last_name: user.userProfile.last_name,
            email: user.userProfile.email,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
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
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.id) {
      console.log("Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if superadmin user
    if (String(payload.id) === "0") {
      console.log("Cannot modify superadmin user")
      return NextResponse.json(
        { error: "Cannot modify superadmin user" },
        { status: 403 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: BigInt(payload.id) },
      include: {
        roles: true,
      },
    })

    if (!user) {
      console.log("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if admin user
    if (user.username === ADMIN_USERNAME) {
      console.log("Cannot modify admin user")
      return NextResponse.json(
        { error: "Cannot modify admin user" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { first_name, last_name, email } = body

    // Validate request data
    if (!first_name && !last_name && !email) {
      console.log("No update data provided")
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      )
    }

    // Check email uniqueness if updating email
    if (email) {
      const existingProfile = await db.userProfile.findUnique({
        where: { email },
      })
      if (existingProfile && existingProfile.userId !== BigInt(payload.id)) {
        console.log("Email already exists")
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        )
      }
    }

    // Update user info
    const updatedUser = await db.user.update({
      where: { id: BigInt(payload.id) },
      data: {
        userProfile:
          first_name || last_name || email
            ? {
                upsert: {
                  create: {
                    first_name: first_name || "",
                    last_name: last_name || "",
                    email: email || "",
                  },
                  update: {
                    ...(first_name && { firstName: first_name }),
                    ...(last_name && { lastName: last_name }),
                    ...(email && { email }),
                  },
                },
              }
            : undefined,
      },
      include: {
        roles: true,
        userProfile: true,
      },
    })

    console.log("User profile updated successfully")
    return NextResponse.json({
      id: Number(updatedUser.id),
      username: updatedUser.username,
      role: updatedUser.roles.name,
      profile: updatedUser.userProfile
        ? {
            first_name: updatedUser.userProfile.first_name,
            last_name: updatedUser.userProfile.last_name,
            email: updatedUser.userProfile.email,
          }
        : null,
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
