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
import {
  getCurrentUserProfile,
  login as loginApi,
  logout as logoutApi,
} from "@/lib/acc-api/client/sdk.gen"
import { User } from "@/lib/acc-api/client/types.gen"
import { useQuery } from "@tanstack/react-query"

interface AuthContextType {
  user: User | undefined
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: userInfo, refetch: refetchUserInfo } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getCurrentUserProfile().then((res) => res.data),
  })
  const router = useRouter()

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      await loginApi({
        body: {
          username,
          password,
        },
      })
      refetchUserInfo()
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = React.useCallback(async () => {
    try {
      await logoutApi()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      router.push("/login")
    }
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user: userInfo,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
