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
import { verifyToken } from "@/lib/auth"
import { AUTH_COOKIE_NAME } from "../../const"

// PUT /acc-api/users/{userId}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const res = await params
    const userId = BigInt(res.userId)
    if (isNaN(Number(userId))) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Get current user authentication info
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const currentUserId = BigInt(payload.id)

    // Get current user's role
    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      include: { roles: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      )
    }

    // Only admin and superadmin can modify roles
    if (
      currentUser.roles.name !== "admin" &&
      currentUser.roles.name !== "superadmin"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to modify roles" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { roleId } = body

    // Check if target user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent users from modifying their own role
    if (currentUserId === userId && roleId !== undefined) {
      return NextResponse.json(
        { error: "Cannot modify your own role" },
        { status: 403 }
      )
    }

    // Only allow role modification
    if (!roleId) {
      return NextResponse.json(
        { error: "Only role modification is allowed" },
        { status: 400 }
      )
    }

    // Prepare update data - only role
    const updateData: any = {}
    updateData.role_id = BigInt(roleId)

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        roles: true,
      },
    })

    return NextResponse.json({
      id: Number(updatedUser.id),
      username: updatedUser.username,
      role: updatedUser.roles.name,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

// DELETE /acc-api/users/{userId}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const res = await params
  console.log("Delete user request received for ID:", res.userId)
  try {
    const userId = BigInt(res.userId)
    if (isNaN(Number(userId))) {
      console.log("Invalid user ID format")
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Check if user exists
    console.log("Checking if user exists")
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    })

    if (existingUser?.roles?.name === "superadmin") {
      return NextResponse.json(
        { error: "Cannot delete superadmin user" },
        { status: 403 }
      )
    }

    if (!existingUser) {
      console.log("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user
    console.log("Deleting user")
    await db.user.delete({
      where: { id: userId },
    })
    console.log("User deleted successfully")

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
