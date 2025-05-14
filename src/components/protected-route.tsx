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

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { PageLoader } from "@/components/shared/page-loader"
import { useAuth } from "@/contexts/auth-context"
import { User } from "lucide-react"
import { PageLoader } from "@/components/shared/page-loader"
import { useAuth } from "@/contexts/auth-context"
import { User } from "lucide-react"

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

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Don't redirect if we're already on the login page
  const isLoginPage = pathname === "/login"

  useEffect(() => {
    // Only redirect if:
    // 1. We're not loading
    // 2. User is not authenticated
    // 3. We're not already on the login page
    if (!isLoading && !user && !isLoginPage) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [user, isLoading, router, pathname, isLoginPage])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <PageLoader
          icon={User}
          title="Authenticating"
          entity="Verifying your credentials"
        />
      </div>
    )
  }

  // Always render children - the sidebar and other authenticated components
  // will handle their own visibility based on auth state
  return <>{children}</>
}
