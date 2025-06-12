import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

// GET /acc-api/users
export async function GET(request: NextRequest) {
  try {
    const users = await db.user.findMany({
      include: {
        roles: true,
      },
    })
    return NextResponse.json(
      users.map((user) => ({
        id: Number(user.id),
        username: user.username,
        role: user.roles.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }))
    )
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// POST /acc-api/users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, roleId } = body

    if (!username || !password || !roleId) {
      return NextResponse.json(
        { error: "Username, password and roleId are required" },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        username,
        password_hash: hashedPassword,
        role_id: roleId,
      },
      include: {
        roles: true,
      },
    })

    return NextResponse.json(
      {
        id: Number(user.id),
        username: user.username,
        role: user.roles.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}
