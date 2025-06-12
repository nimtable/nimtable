/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

interface User {
  id: bigint
  username: string
  roles: {
    name: string
    id: bigint
    createdAt: Date
    updatedAt: Date
    description: string | null
  }
  password_hash: string
  role_id: bigint
  createdAt: Date
  updatedAt: Date
}

// GET /acc-api/users
export async function GET() {
  try {
    const users = await db.user.findMany({
      include: {
        roles: true,
      },
    })
    return NextResponse.json(
      users.map((user: User) => ({
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
