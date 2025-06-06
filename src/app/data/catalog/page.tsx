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
import {
  Database,
  FileText,
  Layers,
  HardDrive,
  Settings,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound, useSearchParams, useRouter } from "next/navigation"
import { PageLoader } from "@/components/shared/page-loader"
import { deleteCatalog } from "@/lib/client/sdk.gen"
import { getCatalogConfig } from "@/lib/data-loader"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"

export default function CatalogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const catalogParam = searchParams.get("catalog")
  const { toast } = useToast()

  const { data: config, isPending } = useQuery({
    queryKey: ["catalog-config", catalogParam],
    queryFn: async () => {
      if (!catalogParam) return undefined
      return await getCatalogConfig(catalogParam)
    },
    enabled: !!catalogParam,
  })

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
  if (isPending || !config) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <PageLoader
          icon={Database}
          title="Loading catalog configuration"
          entity={catalogParam}
          entityType="Catalog"
        />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-muted/5">
      <div className="flex flex-1 justify-center">
        <div className="w-full max-w-5xl px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-600/20 bg-blue-600/10">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{catalogParam}</h1>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Catalog
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the catalog and remove it from the database.
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

          {/* Key Metrics */}
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="group relative overflow-hidden border-muted/70 bg-background shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-blue-500/70"></div>
              <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-blue-500/10 transition-colors duration-200 group-hover:bg-blue-500/30"></div>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="rounded-md bg-blue-50 p-1.5 dark:bg-blue-950/30">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  Default Format
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {config.defaults?.["write.format.default"] || "parquet"}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Default file format for new tables
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-muted/70 bg-background shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-blue-500/70"></div>
              <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-blue-500/10 transition-colors duration-200 group-hover:bg-blue-500/30"></div>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="rounded-md bg-blue-50 p-1.5 dark:bg-blue-950/30">
                    <Layers className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  Compression Codec
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {config.defaults?.["write.parquet.compression-codec"] ||
                    "snappy"}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Default compression algorithm
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-muted/70 bg-background shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-blue-500/70"></div>
              <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-blue-500/10 transition-colors duration-200 group-hover:bg-blue-500/30"></div>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="rounded-md bg-blue-50 p-1.5 dark:bg-blue-950/30">
                    <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  Target File Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {formatFileSize(
                    Number.parseInt(
                      config.overrides?.["write.target-file-size-bytes"] ||
                        "134217728"
                    )
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Target size for data files
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Settings */}
          <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
            <div className="flex items-center gap-3 border-b px-6 py-4">
              <div className="rounded-md bg-blue-50 p-1.5 dark:bg-blue-950/30">
                <Settings className="h-4 w-4 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold">Configuration Settings</h2>
            </div>

            <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
              {/* Default Settings Section */}
              <div className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-base font-medium">Default Settings</h3>
                </div>

                {config.defaults && Object.keys(config.defaults).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(config.defaults).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col gap-1 border-b border-dashed border-muted pb-3 last:border-0 last:pb-0"
                      >
                        <div className="text-sm font-medium">{key}</div>
                        <div className="rounded-sm bg-muted/30 px-2 py-1 font-mono text-sm text-muted-foreground">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No default settings configured
                  </div>
                )}
              </div>

              {/* Override Settings Section */}
              <div className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-base font-medium">Override Settings</h3>
                </div>

                {config.overrides &&
                Object.keys(config.overrides).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(config.overrides).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col gap-1 border-b border-dashed border-muted pb-3 last:border-0 last:pb-0"
                      >
                        <div className="text-sm font-medium">{key}</div>
                        <div className="rounded-sm bg-muted/30 px-2 py-1 font-mono text-sm text-muted-foreground">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No override settings configured
                  </div>
                )}
              </div>
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
