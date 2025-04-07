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
import { Database, RefreshCw, ServerCrash, FolderSearch, AlertCircle, LogOut } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { NamespaceTreeItem } from "@/components/sidebar/tree-items"
import { useRefresh } from "@/contexts/refresh-context"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import type { NamespaceTables } from "@/types/data"
import { loadCatalogNames, loadNamespacesAndTables } from "@/lib/data-loader"
import { Suspense } from "react"

function AppSidebarContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const catalog = searchParams.get("catalog")
  const isLoginPage = pathname === "/login"

  const { toast } = useToast()
  const router = useRouter()
  const { refresh, isRefreshing, refreshTrigger } = useRefresh()
  const { user, logout } = useAuth()

  const [catalogs, setCatalogs] = React.useState<string[]>([])
  const [namespaces, setNamespaces] = React.useState<NamespaceTables[]>([])
  const [catalogListLoading, setCatalogListLoading] = React.useState(true)
  const [namespacesLoading, setNamespacesLoading] = React.useState(false)

  // Don't render sidebar if user is not authenticated or on login page
  if (!user || isLoginPage) {
    return null
  }

  // Load catalogs on mount and when refresh is triggered
  React.useEffect(() => {
    let isMounted = true // Add a flag to track component mount status

    const fetchCatalogs = async () => {
      try {
        setCatalogListLoading(true)
        const data = await loadCatalogNames()
        if (isMounted) {
          setCatalogs(data)
        }

        // If we have catalogs and no catalog is currently selected, select the first one
        // but don't navigate to the catalog page
        if (data.length > 0 && !catalog && isMounted) {
          // Update the URL with the catalog parameter without navigation
          const url = new URL(window.location.href)
          url.searchParams.set("catalog", data[0])
          window.history.replaceState({}, "", url.toString())
        }
      } catch (err) {
        console.error("Failed to load catalogs:", err)
        toast({
          title: "Failed to load catalogs",
          description: "There was an error loading the catalog list. Please try again.",
          variant: "destructive",
        })
        if (isMounted) {
          setCatalogs([])
        }
      } finally {
        if (isMounted) {
          setCatalogListLoading(false)
        }
      }
    }

    fetchCatalogs()

    return () => {
      isMounted = false // Set the flag to false when the component unmounts
    }
  }, [refreshTrigger, toast, catalog])

  // Load namespaces when catalog is selected and when refresh is triggered
  React.useEffect(() => {
    if (!catalog) {
      setNamespaces([])
      return
    }

    let isMounted = true

    const fetchNamespaces = async () => {
      try {
        setNamespacesLoading(true)
        const data = await loadNamespacesAndTables(catalog as string)
        if (isMounted) {
          setNamespaces(data)
        }
      } catch (err) {
        console.error(`Failed to load namespaces for catalog ${catalog}:`, err)
        toast({
          title: "Failed to load namespaces",
          description: `There was an error loading namespaces for catalog "${catalog}". Please try again.`,
          variant: "destructive",
        })
        if (isMounted) {
          setNamespaces([])
        }
      } finally {
        if (isMounted) {
          setNamespacesLoading(false)
        }
      }
    }

    fetchNamespaces()

    return () => {
      isMounted = false
    }
  }, [catalog, refreshTrigger, toast])

  const handleRefresh = React.useCallback(() => {
    refresh()
    toast({
      title: "Refreshing data",
      description: "Fetching the latest catalog information",
    })
  }, [refresh, toast])

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarHeader className="border-b p-3 bg-muted/30">
          {catalogs.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  disabled={catalogListLoading || isRefreshing}
                  value={catalog as string}
                  onValueChange={(value) => {
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
                  <SelectTrigger className="h-9 bg-background border-muted-foreground/20">
                    <Database className="mr-2 h-4 w-4 text-blue-500" />
                    <SelectValue placeholder={catalogListLoading ? "Loading catalogs..." : "Select catalog"} />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogs.map((catalog) => (
                      <SelectItem key={catalog} value={catalog} className="font-medium">
                        {catalog}
                      </SelectItem>
                    ))}
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
                        isRefreshing && "border-blue-500/50 bg-blue-500/10",
                      )}
                      onClick={handleRefresh}
                      disabled={isRefreshing || catalogListLoading}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4 transition-all",
                          isRefreshing ? "animate-spin text-blue-500" : "text-muted-foreground",
                        )}
                      />
                      <span className="sr-only">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{isRefreshing ? "Refreshing..." : "Refresh catalog data"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground border border-muted-foreground/20 rounded-md h-9 flex-1 bg-background">
                <Database className="h-4 w-4" />
                <span className="text-sm">{catalogListLoading ? "Loading catalogs..." : "No catalogs"}</span>
              </div>

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 ml-2 flex-shrink-0 border-muted-foreground/20"
                      onClick={handleRefresh}
                      disabled={isRefreshing || catalogListLoading}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          isRefreshing ? "animate-spin text-blue-500" : "text-muted-foreground/50",
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
                Please connect a database or check your permissions to access catalogs.
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
                <div key={i} className="h-8 bg-muted/30 rounded-md animate-pulse opacity-60" />
              ))}
              <div className="h-8 bg-muted/30 rounded-md animate-pulse opacity-40 w-3/4" />
              <div className="h-8 bg-muted/30 rounded-md animate-pulse opacity-20 w-1/2" />
            </div>
          ) : namespaces.length === 0 && catalog ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center mt-4">
              <ServerCrash className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">No namespaces found</span>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                The catalog <span className="font-medium text-foreground">"{catalog}"</span> doesn't contain any
                namespaces.
              </p>
            </div>
          ) : (
            <div className="mt-1">
              <SidebarMenu>
                {namespaces.map((namespace) => (
                  <SidebarMenuItem key={namespace.name} className="mb-1">
                    <NamespaceTreeItem catalog={catalog as string} namespace={namespace} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
          </div>

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

  // Don't render sidebar if user is not authenticated or on login page
  if (!user || isLoginPage) {
    return null
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppSidebarContent />
    </Suspense>
  )
}
