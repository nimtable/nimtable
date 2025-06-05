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
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { login as loginApi } from "@/lib/client/sdk.gen"
import { client } from "@/lib/client/client.gen"
import { User } from "@/lib/client/types.gen"

export const USER_AUTH_TOKEN_KEY = "nimtable_user_auth_token"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

// Decode JWT token to get user information
const decodeJwtToken = (token: string): User | null => {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    const payload = JSON.parse(jsonPayload)
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    }
  } catch (error) {
    console.error("Failed to decode JWT token:", error)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  // Check if user is already logged in on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        const storedToken = localStorage.getItem(USER_AUTH_TOKEN_KEY)
        if (storedToken) {
          const userData = decodeJwtToken(storedToken)
          if (userData) {
            setUser(userData)
            client.setConfig({
              auth: "Bearer " + storedToken,
            })
          }
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        localStorage.removeItem(USER_AUTH_TOKEN_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await loginApi({
        body: {
          username,
          password,
        },
      })

      if (response.data?.success && response.data?.token) {
        const userData = decodeJwtToken(response.data.token)
        if (!userData) {
          return false
        }
        setUser(userData)
        client.setConfig({
          auth: "Bearer " + response.data.token,
        })
        localStorage.setItem(USER_AUTH_TOKEN_KEY, response.data.token)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = React.useCallback(() => {
    setUser(null)
    localStorage.removeItem(USER_AUTH_TOKEN_KEY)
    router.push("/login")
  }, [router])

  const value = React.useMemo(
    () => ({
      user,
      login,
      logout,
      isLoading,
    }),
    [user, isLoading, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
