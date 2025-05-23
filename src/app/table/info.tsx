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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  dropTable,
  renameTable,
  getFileDistribution,
  type DistributionData,
} from "@/lib/data-loader"
import {
  Database,
  FileText,
  Copy,
  Check,
  Info,
  Layers,
  Hash,
  Calendar,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FileDistributionLoading } from "@/components/table/file-distribution-loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileDistribution } from "@/components/table/file-distribution"
import type { LoadTableResult, StructField } from "@/lib/data-loader"
import { getPropertyDescription } from "@/lib/property-descriptions"
import { useRefresh } from "@/contexts/refresh-context"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { errorToString } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface InfoTabProps {
  tableData: LoadTableResult
  catalog: string
  namespace: string
  table: string
  refreshKey?: number
}

// Function to check if a property key contains sensitive information that should be redacted
const isSensitiveProperty = (key: string): boolean => {
  const sensitiveKeys = ["s3.secret-access-key", "s3.access-key-id"]

  return sensitiveKeys.some((sensitiveKey) =>
    key.toLowerCase().includes(sensitiveKey.toLowerCase())
  )
}

function FileDistributionSection({
  tableId,
  catalog,
  namespace,
  refreshKey,
}: {
  tableId: string
  catalog: string
  namespace: string
  refreshKey?: number
}) {
  const {
    data: distribution,
    isPending,
    isFetching,
    isError,
    refetch,
  } = useQuery<DistributionData>({
    queryKey: ["file-distribution", catalog, namespace, tableId, refreshKey],
    queryFn: () => getFileDistribution(catalog, namespace, tableId),
    enabled: !!(tableId && catalog && namespace),
  })

  if (isPending || isError) {
    return <FileDistributionLoading />
  }

  return (
    <FileDistribution
      distribution={distribution}
      isFetching={isFetching}
      onRefresh={refetch}
    />
  )
}

export function InfoTab({
  tableData,
  catalog,
  namespace,
  table,
  refreshKey,
}: InfoTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { refresh } = useRefresh()
  const [showDropDialog, setShowDropDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newTableName, setNewTableName] = useState(table)
  const [copyingField, setCopyingField] = useState<string | null>(null)

  const schema = tableData.metadata.schemas?.find(
    (s) => s["schema-id"] === tableData.metadata["current-schema-id"]
  )

  const handleDropTable = async () => {
    try {
      await dropTable(catalog, namespace, table)
      toast({
        title: "Table dropped successfully",
        description: `Table ${table} has been dropped from namespace ${namespace}`,
      })
      refresh()
      router.push(`/${catalog}/${namespace}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to drop table",
        description: errorToString(error),
      })
    }
    setShowDropDialog(false)
  }

  const handleRenameTable = async () => {
    try {
      await renameTable(catalog, namespace, table, newTableName)
      toast({
        title: "Table renamed successfully",
        description: `Table ${table} has been renamed to ${newTableName}`,
      })
      refresh()
      router.push(`/${catalog}/${namespace}/table/${newTableName}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to rename table",
        description: errorToString(error),
      })
    }
    setShowRenameDialog(false)
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    setCopyingField(fieldName)
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: `${fieldName} has been copied to your clipboard.`,
        })

        // Reset the copying state after a short delay
        setTimeout(() => {
          setCopyingField(null)
        }, 1500)
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Could not copy to clipboard. " + errorToString(err),
        })
        setCopyingField(null)
      })
  }

  return (
    <div className="space-y-8">
      {/* Table Details */}
      <div className="space-y-6">
        <FileDistributionSection
          tableId={table}
          catalog={catalog}
          namespace={namespace}
          refreshKey={refreshKey}
        />

        <Card className="overflow-hidden border-muted/70 shadow-sm">
          <CardHeader className="border-b py-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-blue-500" />
              Table Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-2">
            <div className="divide-y divide-muted/30">
              <div className="px-6 py-3">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Table UUID
                  </h4>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6 rounded-md transition-all duration-200",
                          copyingField === "Table UUID"
                            ? "bg-muted text-blue-500"
                            : "text-muted-foreground"
                        )}
                        onClick={() =>
                          copyToClipboard(
                            tableData.metadata["table-uuid"],
                            "Table UUID"
                          )
                        }
                      >
                        {copyingField === "Table UUID" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>
                        {copyingField === "Table UUID"
                          ? "Copied!"
                          : "Copy to clipboard"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="rounded-md border border-muted/30 bg-muted/30 p-1.5 font-mono">
                  <p className="break-all text-xs text-foreground/90">
                    {tableData.metadata["table-uuid"]}
                  </p>
                </div>
              </div>

              <div className="px-6 py-3">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Location
                  </h4>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6 rounded-md transition-all duration-200",
                          copyingField === "Location"
                            ? "bg-muted text-blue-500"
                            : "text-muted-foreground"
                        )}
                        onClick={() =>
                          copyToClipboard(
                            tableData.metadata.location || "",
                            "Location"
                          )
                        }
                      >
                        {copyingField === "Location" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>
                        {copyingField === "Location"
                          ? "Copied!"
                          : "Copy to clipboard"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="rounded-md border border-muted/30 bg-muted/30 p-1.5 font-mono">
                  <p className="break-all text-xs text-foreground/90">
                    {tableData.metadata.location}
                  </p>
                </div>
              </div>

              <div className="px-6 py-3">
                <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                  Last Updated
                </h4>
                <p className="pl-1 text-xs font-medium">
                  {tableData.metadata["last-updated-ms"]
                    ? new Date(
                        tableData.metadata["last-updated-ms"]
                      ).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schema Section */}
        <Card className="overflow-hidden border-muted/70 shadow-sm">
          <CardHeader className="border-b pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-blue-500" />
              Table Schema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schema?.fields.map((field: StructField) => (
                  <TableRow key={field.id}>
                    <TableCell>{field.id}</TableCell>
                    <TableCell>{field.name}</TableCell>
                    <TableCell>
                      {typeof field.type === "string"
                        ? field.type
                        : field.type.type}
                    </TableCell>
                    <TableCell>{field.required ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Partition Information */}
        <Card className="overflow-hidden border-muted/70 shadow-sm">
          <CardHeader className="border-b pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-blue-500" />
              Partition Specs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Spec ID</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Default</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.metadata["partition-specs"] &&
                tableData.metadata["partition-specs"].length > 0 ? (
                  tableData.metadata["partition-specs"].map((spec) => (
                    <TableRow key={spec["spec-id"]}>
                      <TableCell>{spec["spec-id"]}</TableCell>
                      <TableCell>
                        {!spec.fields || spec.fields.length === 0 ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Layers className="h-3.5 w-3.5" />
                            <span>Unpartitioned</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Partitioned by:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {spec.fields.map((field) => {
                                // Determine icon based on transform
                                let icon = <Layers className="h-3 w-3" />
                                let bgColor = "bg-blue-100 dark:bg-blue-900/30"
                                let textColor =
                                  "text-blue-800 dark:text-blue-400"

                                if (field.transform.includes("bucket")) {
                                  icon = <Hash className="h-3 w-3" />
                                  bgColor =
                                    "bg-purple-100 dark:bg-purple-900/30"
                                  textColor =
                                    "text-purple-800 dark:text-purple-400"
                                } else if (
                                  field.transform.includes("year") ||
                                  field.transform.includes("month") ||
                                  field.transform.includes("day")
                                ) {
                                  icon = <Calendar className="h-3 w-3" />
                                  bgColor = "bg-green-100 dark:bg-green-900/30"
                                  textColor =
                                    "text-green-800 dark:text-green-400"
                                }

                                return (
                                  <div
                                    key={field["source-id"]}
                                    className={`${bgColor} ${textColor} flex items-center gap-1 rounded-md px-2 py-1 text-xs`}
                                  >
                                    {icon}
                                    <span>{field.name}</span>
                                    <span className="opacity-70">
                                      ({field.transform})
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {spec["spec-id"] ===
                        tableData.metadata["default-spec-id"] ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Default
                          </span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Layers className="h-3.5 w-3.5" />
                        <span>Unpartitioned</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Properties Section */}
      <Card className="overflow-hidden border-muted/70 shadow-sm">
        <CardHeader className="border-b py-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-blue-500" />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-2">
          {tableData.metadata.properties &&
          Object.keys(tableData.metadata.properties).length > 0 ? (
            <div className="divide-y divide-muted/30">
              {Object.entries(tableData.metadata.properties)
                .filter(([key]) => !isSensitiveProperty(key)) // Filter out sensitive properties
                .map(([key, value]) => (
                  <div key={key} className="px-6 py-3">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {key}
                        {getPropertyDescription(key) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground/70" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <p className="text-xs">
                                {getPropertyDescription(key)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </h4>
                    </div>
                    <div className="rounded-md border border-muted/30 bg-muted/30 p-1.5">
                      <p className="break-all font-mono text-xs text-foreground/90">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No properties defined
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drop Dialog */}
      <Dialog open={showDropDialog} onOpenChange={setShowDropDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the table &quot;{table}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDropDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDropTable}>
              Drop Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Table</DialogTitle>
            <DialogDescription>
              Enter a new name for the table &quot;{table}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">New table name</Label>
              <Input
                id="name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Enter new table name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameTable}>Rename Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
