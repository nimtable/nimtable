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
import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useRefresh } from "@/contexts/refresh-context"
import {
  AlertCircle,
  Database,
  FolderSearch,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ServerCrash,
  Users,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import {
  loadCatalogNames,
  loadNamespacesAndTables,
  type NamespaceTables,
} from "@/lib/data-loader"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NamespaceTreeItem } from "@/components/sidebar/tree-items"

function AppSidebarContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const catalog = searchParams.get("catalog")
  const isLoginPage = pathname === "/login"

  const { toast } = useToast()
  const router = useRouter()
  const { refresh, isRefreshing, refreshTrigger } = useRefresh()
  const { user, logout } = useAuth()

  const [searchQuery, setSearchQuery] = React.useState("")

  const { data: catalogs = [], isPending: catalogListLoading } = useQuery<
    string[]
  >({
    queryKey: ["catalogs", refreshTrigger],
    queryFn: async () => {
      const data = await loadCatalogNames()

      // If we have catalogs and no catalog is currently selected, select the first one
      if (data.length > 0 && !catalog) {
        // Update the URL with the catalog parameter without navigation
        const url = new URL(window.location.href)
        url.searchParams.set("catalog", data[0])
        window.history.replaceState({}, "", url.toString())
      }

      return data
    },
  })

  const { data: namespaces = [], isPending: namespacesLoading } = useQuery<
    NamespaceTables[]
  >({
    queryKey: ["namespaces", catalog, refreshTrigger],
    queryFn: async () => {
      if (!catalog) return []
      return await loadNamespacesAndTables(catalog)
    },
    enabled: !!catalog,
  })

  const handleRefresh = React.useCallback(() => {
    refresh()
    toast({
      title: "Refreshing data",
      description: "Fetching the latest catalog information",
    })
  }, [refresh, toast])

  // Filter namespaces and tables based on search query
  const filteredNamespaces = React.useMemo(() => {
    if (!searchQuery) return namespaces

    const searchLower = searchQuery.toLowerCase()

    // Helper function to check if search string is a subsequence of the target
    const isSubsequence = (search: string, target: string) => {
      const cleanTarget = target.replace(/[_-]/g, "").toLowerCase()
      let searchIndex = 0
      let targetIndex = 0

      while (searchIndex < search.length && targetIndex < cleanTarget.length) {
        if (search[searchIndex] === cleanTarget[targetIndex]) {
          searchIndex++
        }
        targetIndex++
      }

      return searchIndex === search.length
    }

    return namespaces
      .map((namespace) => {
        const filteredTables = namespace.tables.filter(
          (table) =>
            table.toLowerCase().includes(searchLower) || // Exact match
            isSubsequence(searchLower, table) // Subsequence match
        )
        const filteredChildren = namespace.children
          .map((child) => {
            const childFilteredTables = child.tables.filter(
              (table) =>
                table.toLowerCase().includes(searchLower) || // Exact match
                isSubsequence(searchLower, table) // Subsequence match
            )
            return {
              ...child,
              tables: childFilteredTables,
            }
          })
          .filter((child) => child.tables.length > 0)

        return {
          ...namespace,
          tables: filteredTables,
          children: filteredChildren,
        }
      })
      .filter(
        (namespace) =>
          namespace.tables.length > 0 ||
          namespace.children.some((child) => child.tables.length > 0)
      )
  }, [namespaces, searchQuery])

  // Don't render sidebar if user is not authenticated or on login page
  if (!user || isLoginPage) {
    return null
  }

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarHeader className="border-b p-3 bg-muted/30">
          {catalogs.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    disabled={catalogListLoading || isRefreshing}
                    value={catalog as string}
                    onValueChange={(value) => {
                      if (value === "new") {
                        router.push("/catalog/new")
                        return
                      }

                      // Update the URL with the catalog parameter without navigation
                      const url = new URL(window.location.href)
                      url.searchParams.set("catalog", value)
                      window.history.replaceState({}, "", url.toString())

                      // Only navigate to catalog page if we're already on a catalog-related page
                      const pathname = window.location.pathname
                      if (
                        pathname.startsWith("/catalog") ||
                        pathname.startsWith("/namespace") ||
                        pathname.startsWith("/table")
                      ) {
                        router.push(`/catalog?catalog=${value}`)
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 bg-background border-muted-foreground/20 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                      <Database className="mr-2 h-4 w-4 text-blue-500" />
                      <SelectValue
                        placeholder={
                          catalogListLoading
                            ? "Loading catalogs..."
                            : "Select catalog"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogs.map((catalog) => (
                        <SelectItem
                          key={catalog}
                          value={catalog}
                          className="font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {catalog}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="new"
                        className="font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span>New Catalog</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          "h-9 w-9 flex-shrink-0 border-muted-foreground/20 transition-all duration-200",
                          isRefreshing && "border-blue-500/50 bg-blue-500/10"
                        )}
                        onClick={handleRefresh}
                        disabled={isRefreshing || catalogListLoading}
                      >
                        <RefreshCw
                          className={cn(
                            "h-4 w-4",
                            isRefreshing
                              ? "animate-spin text-blue-500"
                              : "text-muted-foreground/50"
                          )}
                        />
                        <span className="sr-only">Refresh</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Refresh catalog data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 bg-background border-muted-foreground/20 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 border-muted-foreground/20 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                onClick={() => router.push("/catalog/new")}
              >
                <Plus className="mr-2 h-4 w-4 text-blue-500" />
                New Catalog
              </Button>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-9 w-9 flex-shrink-0 border-muted-foreground/20 transition-all duration-200",
                        isRefreshing && "border-blue-500/50 bg-blue-500/10"
                      )}
                      onClick={handleRefresh}
                      disabled={isRefreshing || catalogListLoading}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          isRefreshing
                            ? "animate-spin text-blue-500"
                            : "text-muted-foreground/50"
                        )}
                      />
                      <span className="sr-only">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Refresh catalog data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </SidebarHeader>

        <div className="px-3 py-3 flex-1 overflow-auto">
          {namespacesLoading && (
            <div className="flex justify-center mb-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500/80 animate-pulse" />
                <span>Loading...</span>
              </div>
            </div>
          )}

          {catalogs.length === 0 && !catalogListLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center mt-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <span className="text-sm font-medium">No catalogs found</span>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Please connect a database or check your permissions to access
                catalogs.
              </p>
            </div>
          ) : !catalog ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center mt-4">
              <FolderSearch className="h-8 w-8 text-blue-500" />
              <span className="text-sm font-medium">Select a catalog</span>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Choose a catalog from the dropdown above to browse its contents.
              </p>
            </div>
          ) : namespacesLoading ? (
            <div className="space-y-2 mt-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-muted/30 rounded-md animate-pulse opacity-60"
                />
              ))}
              <div className="h-8 bg-muted/30 rounded-md animate-pulse opacity-40 w-3/4" />
              <div className="h-8 bg-muted/30 rounded-md animate-pulse opacity-20 w-1/2" />
            </div>
          ) : filteredNamespaces.length === 0 && catalog ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center mt-4">
              <ServerCrash className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">No tables found</span>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {searchQuery ? (
                  <>No tables matching &quot;{searchQuery}&quot; were found.</>
                ) : (
                  <>
                    The catalog{" "}
                    <span className="font-medium text-foreground">
                      &quot;{catalog}&quot;
                    </span>{" "}
                    doesn&apos;t contain any tables.
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="mt-1">
              <SidebarMenu>
                {filteredNamespaces.map((namespace) => (
                  <SidebarMenuItem key={namespace.name} className="mb-1">
                    <NamespaceTreeItem
                      catalog={catalog as string}
                      namespace={namespace}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 bg-muted/30">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-2 mr-auto">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="flex flex-col">
              <span
                className="text-sm font-medium w-24 truncate"
                title={user.name}
              >
                {user.name}
              </span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
          </div>

          {user.role === "admin" && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-blue-500 "
                    asChild
                  >
                    <Link href="/users">
                      <Users className="h-4 w-4" />
                      <span className="sr-only">User Management</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>User Management</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppSidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"
  const isUsersPage = pathname === "/users"
  // Don't render sidebar if user is not authenticated or on login page
  if (!user || isLoginPage || isUsersPage) {
    return null
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppSidebarContent />
    </Suspense>
  )
}
