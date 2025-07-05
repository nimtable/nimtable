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
  Filter,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { useState } from "react"
import Link from "next/link"

interface ScheduledTask {
  id: number
  taskName: string
  catalogName: string
  namespace: string
  tableName: string
  cronExpression: string
  cronDescription: string
  taskType: string
  enabled: boolean
  lastRunAt?: string
  lastRunStatus?: string
  lastRunMessage?: string
  nextRunAt?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  parameters: {
    snapshotRetention: boolean
    retentionPeriod: number
    minSnapshotsToKeep: number
    orphanFileDeletion: boolean
    orphanFileRetention: number
    compaction: boolean
    targetFileSizeBytes: number
    strategy?: string
    sortOrder?: string
    whereClause?: string
  }
}

export default function JobsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [enabledFilter, setEnabledFilter] = useState<string>("all")

  // Get all scheduled tasks
  const {
    data: scheduledTasks,
    isLoading,
    refetch,
  } = useQuery<ScheduledTask[]>({
    queryKey: ["scheduled-tasks"],
    queryFn: async () => {
      const response = await fetch("/api/optimize/scheduled-tasks")
      if (!response.ok) {
        throw new Error("Failed to fetch scheduled tasks")
      }
      return response.json()
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/optimize/scheduled-task/${taskId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete task")
      }
    },
    onSuccess: () => {
      toast({
        title: "Task deleted",
        description: "Scheduled task has been deleted successfully.",
      })
      setShowDeleteDialog(false)
      setSelectedTask(null)
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
    mutationFn: async ({ taskId, enabled }: { taskId: number; enabled: boolean }) => {
      const response = await fetch(`/api/optimize/scheduled-task/${taskId}/toggle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      })
      if (!response.ok) {
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

  // Filter tasks based on search and filters
  const filteredTasks = scheduledTasks?.filter((task) => {
    const matchesSearch = 
      task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.catalogName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tableName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || task.lastRunStatus === statusFilter
    const matchesEnabled = enabledFilter === "all" || 
      (enabledFilter === "enabled" && task.enabled) ||
      (enabledFilter === "disabled" && !task.enabled)

    return matchesSearch && matchesStatus && matchesEnabled
  }) || []

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    // Convert timestamp to number and handle both seconds and milliseconds
    const timestamp = typeof dateString === 'string' ? parseFloat(dateString) : dateString
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

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold">Scheduled Jobs</h1>
        <p className="text-muted-foreground">
          Manage your automated table optimization tasks
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Enabled</Label>
              <Select value={enabledFilter} onValueChange={setEnabledFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setEnabledFilter("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Tasks ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm font-medium">No scheduled tasks found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {scheduledTasks?.length === 0 
                  ? "Create your first scheduled task from the table optimization page"
                  : "Try adjusting your filters to find tasks"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold">{task.taskName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {task.catalogName}.{task.namespace}.{task.tableName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={task.enabled ? "default" : "secondary"}>
                          {task.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        {task.lastRunStatus && (
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(task.lastRunStatus)}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(task.lastRunStatus)}
                              {task.lastRunStatus}
                            </div>
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => 
                          toggleTaskMutation.mutate({ 
                            taskId: task.id, 
                            enabled: !task.enabled 
                          })
                        }
                        disabled={toggleTaskMutation.isPending}
                      >
                        {task.enabled ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Schedule:</span>
                      <div className="font-mono text-xs mt-1">{task.cronExpression}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {task.cronDescription}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next Run:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(task.nextRunAt)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Run:</span>
                      <div className="mt-1">
                        {task.lastRunAt ? formatDate(task.lastRunAt) : "Never"}
                      </div>
                      {task.lastRunMessage && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {task.lastRunMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>Type:</span>
                      <span className="capitalize">{task.taskType}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Created:</span>
                      <span>{formatDate(task.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>By:</span>
                      <span>{task.createdBy}</span>
                    </div>
                    <Link
                      href={`/data/tables/table?catalog=${task.catalogName}&namespace=${task.namespace}&table=${task.tableName}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Table
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the task "{selectedTask?.taskName}"? 
              This action cannot be undone and will stop all future scheduled runs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedTask) {
                  deleteTaskMutation.mutate(selectedTask.id)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 