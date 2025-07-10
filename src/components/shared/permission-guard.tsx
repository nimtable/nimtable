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

import { ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"

type UserRole = "superadmin" | "admin" | "editor" | "viewer"

interface PermissionGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

/**
 * Permission Guard Component
 * Controls UI element visibility based on user roles
 *
 * @param children - UI elements that require permission control
 * @param allowedRoles - Array of roles that are allowed to access
 * @param fallback - Optional content to show when permission is denied
 *
 * @example
 * // Only allow admin and superadmin access
 * <PermissionGuard allowedRoles={["admin", "superadmin"]}>
 *   <AdminPanel />
 * </PermissionGuard>
 *
 * // Only allow superadmin access with fallback
 * <PermissionGuard
 *   allowedRoles={["superadmin"]}
 *   fallback={<div>Insufficient permissions</div>}
 * >
 *   <SuperAdminPanel />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  allowedRoles,
  fallback = null,
}: PermissionGuardProps) {
  const { user } = useAuth()

  // Don't show content if no user info
  if (!user) {
    return fallback
  }

  // Check if user role is in the allowed roles list
  const hasPermission = allowedRoles.includes(user.role as UserRole)

  if (hasPermission) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Permission check hook
 * Used for permission checking within components
 *
 * @param allowedRoles - Array of roles that are allowed to access
 * @returns Whether the user has permission to access
 *
 * @example
 * const hasPermission = usePermission(["admin", "superadmin"])
 * if (hasPermission) {
 *   // Execute permission-required operations
 * }
 */
export function usePermission(allowedRoles: UserRole[]): boolean {
  const { user } = useAuth()

  if (!user) {
    return false
  }

  return allowedRoles.includes(user.role as UserRole)
}

/**
 * Role hierarchy permission check
 * Check if user has the specified role or higher permissions
 *
 * @param minimumRole - Minimum required role level
 * @returns Whether the user has sufficient permissions
 *
 * @example
 * const canEdit = useRoleHierarchy("editor") // Allow editor and above
 * const canAdmin = useRoleHierarchy("admin") // Allow admin and above
 */
export function useRoleHierarchy(minimumRole: UserRole): boolean {
  const { user } = useAuth()

  if (!user) {
    return false
  }

  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
    superadmin: 4,
  }

  const userRoleLevel = roleHierarchy[user.role as UserRole] || 0
  const requiredLevel = roleHierarchy[minimumRole] || 0

  return userRoleLevel >= requiredLevel
}
