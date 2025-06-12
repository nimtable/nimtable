import { NextRequest, NextResponse } from "next/server"
import { sign } from "jsonwebtoken"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"
import { LoginResponse } from "@/lib/acc-api/client/types.gen"
import { AUTH_COOKIE_NAME } from "../../const"

const JWT_SECRET = process.env.JWT_SECRET || ""
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"

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
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
      })

      return response
    }

    // If not a database user, check if it's a super admin
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = sign(
        {
          id: "0",
          username: ADMIN_USERNAME,
          role: "admin",
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
        secure: process.env.NODE_ENV === "production",
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
