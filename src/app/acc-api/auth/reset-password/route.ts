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
import { db } from "@/lib/db"
import { hash, compare } from "bcryptjs"
import { AUTH_COOKIE_NAME } from "../../const"
import { verifyToken } from "@/lib/auth"

// PATCH /acc-api/auth/reset-password
export async function PATCH(request: NextRequest) {
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
    const { currentPassword, newPassword } = body

    // Validate request data
    if (!currentPassword || !newPassword) {
      console.log("Missing required fields")
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    // Get user from database
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

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.password_hash)
    if (!isPasswordValid) {
      console.log("Invalid current password")
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10)

    // Update password
    await db.user.update({
      where: { id: BigInt(payload.id) },
      data: { password_hash: hashedPassword },
    })

    console.log("Password updated successfully")
    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error updating password:", error)
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    )
  }
}
