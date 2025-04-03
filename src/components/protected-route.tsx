"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PageLoader } from "@/components/shared/page-loader"
import { User } from "lucide-react"

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
                <PageLoader icon={User} title="Authenticating" entity="Verifying your credentials" />
            </div>
        )
    }

    // Always render children - the sidebar and other authenticated components
    // will handle their own visibility based on auth state
    return <>{children}</>
}
