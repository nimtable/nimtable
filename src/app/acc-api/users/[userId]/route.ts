import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

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

    const body = await request.json()
    const { username, password, roleId } = body

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if new username is already taken by another user
    if (username && username !== existingUser.username) {
      const usernameExists = await db.user.findUnique({
        where: { username },
      })

      if (usernameExists) {
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
    if (roleId) updateData.role_id = BigInt(roleId)

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
    })

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
