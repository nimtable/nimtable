"use client"

import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  Pause,
  Trash2,
  Search,
  Settings,
  Database,
  Timer,
  HardDrive,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  getScheduledTasks,
  deleteScheduledTask,
  toggleScheduledTask,
  type ScheduledTask,
} from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { useState } from "react"
import Link from "next/link"

// Using ScheduledTask type from generated SDK

export default function JobsPage() {
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [enabledFilter, setEnabledFilter] = useState<string>("all")
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())

  // Get all scheduled tasks
  const {
    data: scheduledTasks,
    isLoading,
    refetch,
  } = useQuery<ScheduledTask[]>({
    queryKey: ["scheduled-tasks"],
    queryFn: async () => {
      const response = await getScheduledTasks()
      if (response.error) {
        throw new Error("Failed to fetch scheduled tasks")
      }
      return response.data || []
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await deleteScheduledTask({
        path: { id: taskId },
      })
      if (response.error) {
        throw new Error("Failed to delete task")
      }
    },
    onSuccess: () => {
      toast({
        title: "Task deleted",
        description: "Scheduled task has been deleted successfully.",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete task",
        description: errorToString(error),
      })
    },
  })

  // Toggle task enabled status
  const toggleTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      enabled,
    }: {
      taskId: number
      enabled: boolean
    }) => {
      const response = await toggleScheduledTask({
        path: { id: taskId },
        body: { enabled },
      })
      if (response.error) {
        throw new Error("Failed to toggle task")
      }
    },
    onSuccess: () => {
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update task",
        description: errorToString(error),
      })
    },
  })

  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    const gb = mb / 1024
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${mb.toFixed(0)} MB`
  }

  const formatDuration = (milliseconds: number) => {
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000))
    const hours = Math.floor(
      (milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    )

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""}`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`
    } else {
      return `${Math.floor(milliseconds / (60 * 1000))} minute${Math.floor(milliseconds / (60 * 1000)) > 1 ? "s" : ""}`
    }
  }

  // Filter tasks based on search and filters
  const filteredTasks =
    scheduledTasks?.filter((task) => {
      const matchesSearch =
        task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.catalogName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tableName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || task.lastRunStatus === statusFilter
      const matchesEnabled =
        enabledFilter === "all" ||
        (enabledFilter === "enabled" && task.enabled) ||
        (enabledFilter === "disabled" && !task.enabled)

      return matchesSearch && matchesStatus && matchesEnabled
    }) || []

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    // Convert timestamp to number and handle both seconds and milliseconds
    const timestamp =
      typeof dateString === "string" ? parseFloat(dateString) : dateString
    // If timestamp is in seconds (less than 1e12), convert to milliseconds
    const timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(timestampMs))
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "RUNNING":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 border-green-200"
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200"
      case "RUNNING":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background h-full">
      {/* Search and filters bar */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-10 bg-card border-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-card border-input">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
              </SelectContent>
            </Select>
            <Select value={enabledFilter} onValueChange={setEnabledFilter}>
              <SelectTrigger className="w-[140px] bg-card border-input">
                <SelectValue placeholder="All tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm ||
              statusFilter !== "all" ||
              enabledFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setEnabledFilter("all")
                }}
                className="bg-card border-input"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-card-foreground" />
            <h2 className="text-m font-normal text-card-foreground">
              Scheduled Tasks ({filteredTasks.length})
            </h2>
          </div>
        </div>
        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {scheduledTasks?.length === 0
                ? "No scheduled tasks found. Create your first scheduled task from the table optimization page"
                : "No tasks found matching your criteria"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-table-header border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Task Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Next Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Last Run
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredTasks.map((task) => (
                    <>
                      <tr
                        key={task.id}
                        className="group hover:bg-table-row-hover transition-colors cursor-pointer"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {expandedTasks.has(task.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <div className="text-sm font-normal text-card-foreground">
                                {task.taskName}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {task.taskType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-card-foreground">
                            {task.catalogName}.{task.namespace}.{task.tableName}
                          </div>
                          <Link
                            href={`/data/tables/table?catalog=${task.catalogName}&namespace=${task.namespace}&table=${task.tableName}`}
                            className="text-xs text-primary hover:text-primary/80 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Table
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={task.enabled ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {task.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                            {task.lastRunStatus && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${getStatusColor(task.lastRunStatus)}`}
                              >
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(task.lastRunStatus)}
                                  {task.lastRunStatus}
                                </div>
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-card-foreground font-mono">
                            {task.cronExpression}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {task.cronDescription}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(task.nextRunAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {task.lastRunAt
                              ? formatDate(task.lastRunAt)
                              : "Never"}
                          </div>
                          {task.lastRunMessage && (
                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                              {task.lastRunMessage}
                            </div>
                          )}
                        </td>
                        <td className="text-center w-32">
                          <div
                            className="text-center opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleTaskMutation.mutate({
                                  taskId: task.id,
                                  enabled: !task.enabled,
                                })
                              }
                              disabled={toggleTaskMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              {task.enabled ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="rounded-full p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the task "{task.taskName}
                                    " and stop all future scheduled runs.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      deleteTaskMutation.mutate(task.id)
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {expandedTasks.has(task.id) && (
                        <tr className="bg-muted/30">
                          <td colSpan={7} className="px-6 py-4">
                            <Collapsible
                              open={expandedTasks.has(task.id)}
                              onOpenChange={() => toggleTaskExpansion(task.id)}
                            >
                              <CollapsibleContent>
                                <div className="space-y-4 pt-4">
                                  {/* Optimization Settings */}
                                  <div>
                                    <h4 className="flex items-center gap-2 font-medium text-sm mb-4 text-card-foreground">
                                      <Settings className="h-4 w-4 text-blue-500" />
                                      Optimization Configuration
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {/* Snapshot Retention */}
                                      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Timer className="h-4 w-4 text-green-500" />
                                            <span className="font-medium text-sm text-card-foreground">
                                              Snapshot Retention
                                            </span>
                                          </div>
                                          <Badge
                                            variant={
                                              task.parameters.snapshotRetention
                                                ? "default"
                                                : "secondary"
                                            }
                                            className="text-xs"
                                          >
                                            {task.parameters.snapshotRetention
                                              ? "Enabled"
                                              : "Disabled"}
                                          </Badge>
                                        </div>
                                        {task.parameters.snapshotRetention ? (
                                          <div className="space-y-2 pt-2 border-t border-border">
                                            <div className="flex justify-between items-start">
                                              <span className="text-xs text-muted-foreground">
                                                Retention Period:
                                              </span>
                                              <span className="text-xs font-medium text-card-foreground text-right ml-4">
                                                {formatDuration(
                                                  task.parameters
                                                    .retentionPeriod
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-start">
                                              <span className="text-xs text-muted-foreground">
                                                Min Snapshots:
                                              </span>
                                              <span className="text-xs font-medium text-card-foreground text-right ml-4">
                                                {
                                                  task.parameters
                                                    .minSnapshotsToKeep
                                                }
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                                            Not configured
                                          </p>
                                        )}
                                      </div>

                                      {/* Compaction */}
                                      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-purple-500" />
                                            <span className="font-medium text-sm text-card-foreground">
                                              Compaction
                                            </span>
                                          </div>
                                          <Badge
                                            variant={
                                              task.parameters.compaction
                                                ? "default"
                                                : "secondary"
                                            }
                                            className="text-xs"
                                          >
                                            {task.parameters.compaction
                                              ? "Enabled"
                                              : "Disabled"}
                                          </Badge>
                                        </div>
                                        {task.parameters.compaction ? (
                                          <div className="space-y-2 pt-2 border-t border-border">
                                            <div className="flex justify-between items-start">
                                              <span className="text-xs text-muted-foreground">
                                                Target File Size:
                                              </span>
                                              <span className="text-xs font-medium text-card-foreground text-right ml-4">
                                                {formatBytes(
                                                  task.parameters
                                                    .targetFileSizeBytes
                                                )}
                                              </span>
                                            </div>
                                            {task.parameters.strategy && (
                                              <div className="flex justify-between items-start">
                                                <span className="text-xs text-muted-foreground">
                                                  Strategy:
                                                </span>
                                                <span className="text-xs font-medium text-card-foreground text-right ml-4 capitalize">
                                                  {task.parameters.strategy}
                                                </span>
                                              </div>
                                            )}
                                            {task.parameters.sortOrder && (
                                              <div className="flex justify-between items-start">
                                                <span className="text-xs text-muted-foreground">
                                                  Sort Order:
                                                </span>
                                                <span className="text-xs font-medium text-card-foreground text-right ml-4">
                                                  {task.parameters.sortOrder}
                                                </span>
                                              </div>
                                            )}
                                            {task.parameters.whereClause && (
                                              <div className="flex justify-between items-start">
                                                <span className="text-xs text-muted-foreground">
                                                  Where Clause:
                                                </span>
                                                <span className="text-xs font-mono text-card-foreground text-right ml-4 break-all max-w-[60%]">
                                                  {task.parameters.whereClause}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                                            Not configured
                                          </p>
                                        )}
                                      </div>

                                      {/* Orphan File Deletion */}
                                      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <HardDrive className="h-4 w-4 text-orange-500" />
                                            <span className="font-medium text-sm text-card-foreground">
                                              Orphan File Deletion
                                            </span>
                                          </div>
                                          <Badge
                                            variant={
                                              task.parameters.orphanFileDeletion
                                                ? "default"
                                                : "secondary"
                                            }
                                            className="text-xs"
                                          >
                                            {task.parameters.orphanFileDeletion
                                              ? "Enabled"
                                              : "Disabled"}
                                          </Badge>
                                        </div>
                                        {task.parameters.orphanFileDeletion ? (
                                          <div className="space-y-2 pt-2 border-t border-border">
                                            <div className="flex justify-between items-start">
                                              <span className="text-xs text-muted-foreground">
                                                Retention:
                                              </span>
                                              <span className="text-xs font-medium text-card-foreground text-right ml-4">
                                                {formatDuration(
                                                  task.parameters
                                                    .orphanFileRetention
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                                            Not configured
                                          </p>
                                        )}
                                      </div>

                                      {/* Task Metadata */}
                                      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium text-sm text-card-foreground">
                                            Task Details
                                          </span>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-border">
                                          <div className="flex justify-between items-start">
                                            <span className="text-xs text-muted-foreground">
                                              Task ID:
                                            </span>
                                            <span className="text-xs font-mono font-medium text-card-foreground text-right ml-4">
                                              {task.id}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-start">
                                            <span className="text-xs text-muted-foreground">
                                              Type:
                                            </span>
                                            <span className="text-xs font-medium text-card-foreground text-right ml-4 capitalize">
                                              {task.taskType}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-start">
                                            <span className="text-xs text-muted-foreground">
                                              Created:
                                            </span>
                                            <span className="text-xs font-medium text-card-foreground text-right ml-4">
                                              {formatDate(task.createdAt)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-start">
                                            <span className="text-xs text-muted-foreground">
                                              Updated:
                                            </span>
                                            <span className="text-xs font-medium text-card-foreground text-right ml-4">
                                              {formatDate(task.updatedAt)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-start">
                                            <span className="text-xs text-muted-foreground">
                                              Created By:
                                            </span>
                                            <span className="text-xs font-medium text-card-foreground text-right ml-4">
                                              {task.createdBy}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Raw Configuration */}
                                  <div>
                                    <h4 className="flex items-center gap-2 font-medium text-sm mb-3 text-card-foreground">
                                      <Settings className="h-4 w-4 text-muted-foreground" />
                                      Raw Configuration
                                    </h4>
                                    <div className="bg-muted/30 border border-border rounded-lg p-4 font-mono text-xs overflow-x-auto">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(
                                          task.parameters,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
