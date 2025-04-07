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

interface User {
  username: string
  name: string
  role: "admin" | "user"
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  // Check if user is already logged in on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        localStorage.removeItem("user")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // In a real app, you would validate credentials against your backend
      // This is just a simple demo implementation
      if (username === "admin" && password === "password") {
        const userData: User = {
          username: "admin",
          name: "Admin User",
          role: "admin",
        }
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        return true
      } else if (username === "user" && password === "password") {
        const userData: User = {
          username: "user",
          name: "Regular User",
          role: "user",
        }
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
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
    localStorage.removeItem("user")
    router.push("/login")
  }, [router])

  const value = React.useMemo(
    () => ({
      user,
      login,
      logout,
      isLoading,
    }),
    [user, isLoading, logout],
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
