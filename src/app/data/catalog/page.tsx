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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Database, Trash2, ArrowLeft } from "lucide-react"
import { notFound, useSearchParams, useRouter } from "next/navigation"
import { PageLoader } from "@/components/shared/page-loader"
import { deleteCatalog } from "@/lib/client/sdk.gen"
import { getCatalogConfig, getCatalogDetails } from "@/lib/data-loader"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { CircleQuestionIcon } from "@/components/icon"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useNamespaces } from "../hooks/useNamespaces"
import { useAllTables } from "../hooks/useTables"
import { useCatalogStats } from "../utils"
import { formatDistanceToNow } from "date-fns"
import React from "react"

export default function CatalogPage() {
  const router = useRouter()

  const searchParams = useSearchParams()
  const catalogParam = searchParams.get("catalog")

  const { namespaces } = useNamespaces([catalogParam || ""])
  const { tables, isLoading: isLoadingTables } = useAllTables()

  const catalogStats = useCatalogStats(
    [catalogParam || ""],
    namespaces || [],
    tables || []
  )

  const { toast } = useToast()

  // Fetch catalog configuration (REST config)
  const { data: config, isPending: isConfigPending } = useQuery({
    queryKey: ["catalog-config", catalogParam],
    queryFn: async () => {
      if (!catalogParam) return undefined
      return await getCatalogConfig(catalogParam)
    },
    enabled: !!catalogParam,
  })

  // Fetch catalog details from database
  const { data: catalogDetails, isPending: isDetailsPending } = useQuery({
    queryKey: ["catalog-details", catalogParam],
    queryFn: async () => {
      if (!catalogParam) return undefined
      return await getCatalogDetails(catalogParam)
    },
    enabled: !!catalogParam,
  })

  const isPending = isConfigPending || isDetailsPending || isLoadingTables

  const handleDelete = async () => {
    if (!catalogParam) return

    try {
      await deleteCatalog({
        path: {
          catalogName: catalogParam,
        },
      })
      toast({
        title: "Catalog deleted successfully",
        description: "The catalog has been removed from the database.",
      })
      router.push("/")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete catalog",
        description: errorToString(error),
      })
    }
  }

  // Ensure we have a catalog parameter
  if (!catalogParam) {
    return notFound()
  }

  // Loading state
  if (isPending) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <PageLoader
          icon={Database}
          title="Loading catalog information"
          entity={catalogParam}
          entityType="Catalog"
        />
      </div>
    )
  }

  // If no config and no database details, catalog doesn't exist
  if (!config && !catalogDetails) {
    return notFound()
  }

  // Merge database properties and config defaults, prioritizing database
  const mergedDefaults = {
    ...(config?.defaults || {}),
    ...(catalogDetails?.properties || {}),
  }

  // Get overrides
  const overrides = config?.overrides || {}

  // Helper function to check if a value is long and needs copy button
  const isLongValue = (value: string | number | undefined): boolean => {
    if (!value) return false
    const str = String(value)
    return str.length > 50 || str.includes("http") || str.includes("arn:")
  }

  // Helper function to render a config item
  const renderConfigItem = (
    key: string,
    value: string | number | undefined,
    showCopyButton = false
  ) => {
    const displayValue = value !== undefined ? String(value) : ""
    const needsCopyButton = showCopyButton || isLongValue(value)

    if (needsCopyButton) {
      return (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <p className="text-sm font-medium text-card-foreground">{key}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground break-all flex-1">
              {displayValue}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(displayValue)}
              className="shrink-0 p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              title="Copy to clipboard"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 448 512"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z" />
              </svg>
            </button>
          </div>
        </div>
      )
    }

    return (
      <div>
        <p className="text-sm font-medium text-card-foreground mb-1">{key}</p>
        <p className="text-sm text-muted-foreground">{displayValue}</p>
      </div>
    )
  }

  // Convert mergedDefaults to array and split into pairs for grid layout
  const defaultEntries = Object.entries(mergedDefaults)
  const defaultPairs: Array<
    [
      [string, string | number | undefined],
      [string, string | number | undefined]?,
    ]
  > = []
  for (let i = 0; i < defaultEntries.length; i += 2) {
    defaultPairs.push([
      defaultEntries[i] as [string, string | number | undefined],
      defaultEntries[i + 1] as
        | [string, string | number | undefined]
        | undefined,
    ])
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-muted/5">
      {/* Page header with catalog name */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/catalog"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-card-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h2 className="text-m font-normal text-card-foreground">
                  {catalogParam}
                </h2>
              </div>
              <span className="px-2 py-1 text-xs font-normal bg-muted text-muted-foreground rounded">
                Catalog details
              </span>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  catalog and remove it from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {/* Main content with cards */}
      <div className="flex-1 p-6 bg-[#fafafa]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Details card - spans 3 columns */}
          <div className="md:col-span-3 bg-card border border-border rounded-lg p-3">
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs text-muted-foreground">
                        Catalog Type
                      </p>
                      <CircleQuestionIcon className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The type of catalog implementation</p>
                  </TooltipContent>
                </Tooltip>

                <p className="text-sm font-medium text-card-foreground">
                  {catalogDetails?.type ||
                    config?.defaults?.type ||
                    (config?.defaults?.["catalog-impl"]?.includes(".")
                      ? config?.defaults?.["catalog-impl"]?.split(".").pop()
                      : config?.defaults?.["catalog-impl"]) ||
                    "hadoop"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Storage size (GB)
                </p>
                <p className="text-sm font-medium text-card-foreground">
                  {catalogStats[catalogParam || ""]?.storageSize
                    ? `${(catalogStats[catalogParam || ""].storageSize / (1024 * 1024)).toFixed(2)} MB`
                    : "0 MB"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Last modified
                </p>
                <p className="text-sm font-medium text-card-foreground">
                  {catalogStats[catalogParam || ""]?.lastModified
                    ? formatDistanceToNow(
                        catalogStats[catalogParam || ""].lastModified,
                        { addSuffix: true }
                      )
                    : "Never"}
                </p>
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 mb-1 cursor-help">
                      <p className="text-xs text-muted-foreground">
                        Default Format
                      </p>
                      <CircleQuestionIcon className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Default file format for new tables</p>
                  </TooltipContent>
                </Tooltip>
                <p className="text-sm font-medium text-card-foreground">
                  {config?.defaults?.["write.format.default"] || "parquet"}
                </p>
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 mb-1 cursor-help">
                      <p className="text-xs text-muted-foreground">
                        Compression Codec
                      </p>
                      <CircleQuestionIcon className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Default compression algorithm</p>
                  </TooltipContent>
                </Tooltip>
                <p className="text-sm font-medium text-card-foreground">
                  {config?.defaults?.["write.parquet.compression-codec"] ||
                    "snappy"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Target File Size
                </p>
                <p className="text-sm font-medium text-card-foreground">
                  {formatFileSize(
                    Number.parseInt(
                      config?.overrides?.["write.target-file-size-bytes"] ||
                        "134217728"
                    )
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Namespaces card - spans 1 column */}
          <a
            href="/namespaces"
            className="md:col-span-1 bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors flex flex-col items-center justify-center gap-2"
          >
            <p className="text-xs text-muted-foreground">Namespaces</p>
            <p className="text-4xl font-semibold text-primary">
              {catalogStats[catalogParam || ""]?.namespaceCount || 0}
            </p>
          </a>

          {/* Tables card - spans 1 column */}
          <a
            href="/tables"
            className="md:col-span-1 bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors flex flex-col items-center justify-center gap-2"
          >
            <p className="text-xs text-muted-foreground">Tables</p>
            <p className="text-4xl font-semibold text-primary">
              {catalogStats[catalogParam || ""]?.tableCount || 0}
            </p>
          </a>
        </div>

        {/* Configuration Settings */}
        <div className="bg-card border border-border rounded-lg p-4 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-primary"
              viewBox="0 0 512 512"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.1-20.7-3.2-30.5c-2.4-11.2-16.1-14.1-24.2-6l-63.9 63.9c-3 3-7.1 4.7-11.3 4.7H352c-8.8 0-16-7.2-16-16V102.6c0-4.2 1.7-8.3 4.7-11.3l63.9-63.9c8.1-8.1 5.2-21.8-6-24.2C388.7 1.1 378.5 0 368 0C288.5 0 224 64.5 224 144l0 .8 85.3 85.3c36-9.1 75.8 .5 104 28.7L429 274.5c49-23 83-72.8 83-130.5zM56 432a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-card-foreground">
              Configuration Settings
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            {/* Default Settings - Grouped left 2 columns with visual border */}
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-semibold text-card-foreground mb-3">
                Default Settings
              </h4>
              {Object.keys(mergedDefaults).length > 0 ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {defaultPairs.map((pair, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      <div>{renderConfigItem(pair[0][0], pair[0][1])}</div>
                      {pair[1] && (
                        <div>{renderConfigItem(pair[1][0], pair[1][1])}</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No default settings configured
                </p>
              )}
            </div>

            {/* Override Settings - Right column */}
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-semibold text-card-foreground mb-3">
                Override Settings
              </h4>
              {Object.keys(overrides).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(overrides).map(([key, value]) => (
                    <div key={key}>{renderConfigItem(key, value)}</div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No override settings configured
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}
