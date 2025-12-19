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
import { eq, sql } from "drizzle-orm"
import { db } from "@/db/db"
import { aiSettings } from "@/db/schema"
import { verifyToken } from "@/lib/auth"
import { AUTH_COOKIE_NAME } from "../../acc-api/const"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userSettings = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.userId, Number(payload.id)))
      .limit(1)

    if (userSettings.length === 0) {
      // Return empty settings if none exist
      return NextResponse.json({
        endpoint: "",
        apiKey: "",
        hasApiKey: false,
        modelName: "",
        isEnabled: false,
      })
    }

    const settings = userSettings[0]
    return NextResponse.json({
      endpoint: settings.endpoint,
      apiKey: "", // Never return actual API key for security
      hasApiKey: !!settings.apiKey, // Flag to indicate if API key exists
      modelName: settings.modelName,
      isEnabled: settings.isEnabled,
    })
  } catch (error) {
    console.error("Error fetching AI settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, apiKey, modelName, isEnabled } = body

    // Validate required fields only when enabled
    if (isEnabled && (!endpoint || !modelName)) {
      return NextResponse.json(
        { error: "Endpoint and model name are required when AI is enabled" },
        { status: 400 }
      )
    }

    // Check if settings exist for this user
    const existingSettings = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.userId, Number(payload.id)))
      .limit(1)

    // Prepare settings data, only update API key if provided
    const settingsData: any = {
      endpoint: endpoint || "",
      modelName: modelName || "",
      isEnabled: Boolean(isEnabled),
      updatedAt: sql`CURRENT_TIMESTAMP`,
    }

    // Only update API key if it's explicitly provided
    if (apiKey !== undefined) {
      settingsData.apiKey = apiKey || null
    }

    if (existingSettings.length > 0) {
      // Update existing settings
      await db
        .update(aiSettings)
        .set(settingsData)
        .where(eq(aiSettings.userId, Number(payload.id)))
    } else {
      // Create new settings
      await db.insert(aiSettings).values({
        userId: Number(payload.id),
        ...settingsData,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving AI settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
