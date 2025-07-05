"use client"

import {
  ChevronRight,
  Calendar,
  Trash2,
  Edit,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { CrontabGenerator } from "@/components/table/crontab-generator"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
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

interface ScheduleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog: string
  namespace: string
  table: string
}

export function ScheduleSheet({
  open,
  onOpenChange,
  catalog,
  namespace,
  table,
}: ScheduleSheetProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)

  // Form state for create/edit
  const [taskName, setTaskName] = useState("")
  const [cronExpression, setCronExpression] = useState("0 0 2 * * *") // Daily at 2 AM
  const [enabled, setEnabled] = useState(true)
  const [snapshotRetention, setSnapshotRetention] = useState(true)
  const [retentionPeriod, setRetentionPeriod] = useState("432000000") // 5 days
  const [minSnapshotsToKeep, setMinSnapshotsToKeep] = useState("1")
  const [orphanFileDeletion, setOrphanFileDeletion] = useState(false)
  const [orphanFileRetention, setOrphanFileRetention] = useState("86400000") // 1 day
  const [compaction, setCompaction] = useState(true)
  const [targetFileSizeBytes, setTargetFileSizeBytes] = useState(536870912) // 512MB
  const [strategy, setStrategy] = useState("binpack")
  const [sortOrder, setSortOrder] = useState("")
  const [whereClause, setWhereClause] = useState("")

  // Get scheduled tasks
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
    enabled: open,
  })

  // Filter tasks for current table
  const tableTasks =
    scheduledTasks?.filter(
      (task) =>
        task.catalogName === catalog &&
        task.namespace === namespace &&
        task.tableName === table
    ) || []

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch(
        `/api/optimize/${catalog}/${namespace}/${table}/schedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create scheduled task")
      }
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Task scheduled",
        description: "Compaction task has been scheduled successfully.",
      })
      setShowCreateDialog(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to schedule task",
        description: errorToString(error),
      })
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

  const resetForm = () => {
    setTaskName("")
    setCronExpression("0 0 2 * * *")
    setEnabled(true)
    setSnapshotRetention(true)
    setRetentionPeriod("432000000")
    setMinSnapshotsToKeep("1")
    setOrphanFileDeletion(false)
    setOrphanFileRetention("86400000")
    setCompaction(true)
    setTargetFileSizeBytes(536870912)
    setStrategy("binpack")
    setSortOrder("")
    setWhereClause("")
  }

  const handleCreate = () => {
    const taskData = {
      taskName: taskName || `${catalog}_${namespace}_${table}_compaction`,
      cronExpression,
      enabled,
      snapshotRetention,
      retentionPeriod: parseInt(retentionPeriod),
      minSnapshotsToKeep: parseInt(minSnapshotsToKeep),
      orphanFileDeletion,
      orphanFileRetention: parseInt(orphanFileRetention),
      compaction,
      targetFileSizeBytes,
      strategy: strategy || undefined,
      sortOrder: sortOrder || undefined,
      whereClause: whereClause || undefined,
      createdBy: "user", // TODO: Get from auth context
    }
    createTaskMutation.mutate(taskData)
  }

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
    }).format(new Date(timestampMs))
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col p-0 sm:max-w-full"
      >
        {/* Header */}
        <div className="border-b bg-background">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href={`/data/tables/table?catalog=${catalog}&namespace=${namespace}&table=${table}`}
                  className="font-medium text-muted-foreground hover:text-foreground"
                >
                  {table}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Schedule</span>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Tasks List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduled Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : tableTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm font-medium">No scheduled tasks</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create a task to automate table optimization
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tableTasks.map((task) => (
                      <div
                        key={task.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{task.taskName}</h3>
                            <Badge
                              variant={task.enabled ? "default" : "secondary"}
                            >
                              {task.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                            {task.lastRunStatus && (
                              <div className="flex items-center gap-1">
                                {getStatusIcon(task.lastRunStatus)}
                                <span className="text-xs text-muted-foreground">
                                  {task.lastRunStatus}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTask(task)
                                setShowEditDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
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

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Schedule:
                            </span>
                            <div className="font-mono">
                              {task.cronExpression}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {task.cronDescription}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Next Run:
                            </span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(task.nextRunAt)}
                            </div>
                          </div>
                        </div>

                        {task.lastRunAt && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Last Run:
                              </span>
                              <div>{formatDate(task.lastRunAt)}</div>
                            </div>
                            {task.lastRunMessage && (
                              <div>
                                <span className="text-muted-foreground">
                                  Message:
                                </span>
                                <div className="text-xs">
                                  {task.lastRunMessage}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Task Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Scheduled Task</DialogTitle>
              <DialogDescription>
                Schedule automated compaction for {catalog}.{namespace}.{table}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Task Name */}
              <div className="space-y-2">
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                  id="taskName"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder={`${catalog}_${namespace}_${table}_compaction`}
                />
              </div>

              {/* Cron Expression */}
              <CrontabGenerator
                value={cronExpression}
                onChange={setCronExpression}
              />

              {/* Task Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enabled */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Task</Label>
                      <p className="text-xs text-muted-foreground">
                        Whether this task should run automatically
                      </p>
                    </div>
                    <Switch checked={enabled} onCheckedChange={setEnabled} />
                  </div>

                  {/* Compaction */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compaction</Label>
                      <p className="text-xs text-muted-foreground">
                        Rewrite data files to improve query performance
                      </p>
                    </div>
                    <Switch
                      checked={compaction}
                      onCheckedChange={setCompaction}
                    />
                  </div>

                  {compaction && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label>Target File Size (MB)</Label>
                        <Input
                          type="number"
                          value={Math.round(
                            targetFileSizeBytes / (1024 * 1024)
                          )}
                          onChange={(e) =>
                            setTargetFileSizeBytes(
                              parseInt(e.target.value) * 1024 * 1024
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Strategy</Label>
                        <Input
                          value={strategy}
                          onChange={(e) => setStrategy(e.target.value)}
                          placeholder="binpack"
                        />
                      </div>
                    </div>
                  )}

                  {/* Snapshot Retention */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Snapshot Retention</Label>
                      <p className="text-xs text-muted-foreground">
                        Clean up old snapshots to save storage
                      </p>
                    </div>
                    <Switch
                      checked={snapshotRetention}
                      onCheckedChange={setSnapshotRetention}
                    />
                  </div>

                  {snapshotRetention && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label>Retention Period (days)</Label>
                        <Input
                          type="number"
                          value={Math.round(
                            parseInt(retentionPeriod) / (1000 * 60 * 60 * 24)
                          )}
                          onChange={(e) =>
                            setRetentionPeriod(
                              (
                                parseInt(e.target.value) *
                                1000 *
                                60 *
                                60 *
                                24
                              ).toString()
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Min Snapshots to Keep</Label>
                        <Input
                          type="number"
                          value={minSnapshotsToKeep}
                          onChange={(e) =>
                            setMinSnapshotsToKeep(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Orphan File Deletion */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Orphan File Deletion</Label>
                      <p className="text-xs text-muted-foreground">
                        Remove orphaned files not referenced by metadata
                      </p>
                    </div>
                    <Switch
                      checked={orphanFileDeletion}
                      onCheckedChange={setOrphanFileDeletion}
                    />
                  </div>

                  {orphanFileDeletion && (
                    <div className="ml-6">
                      <div className="space-y-2">
                        <Label>Orphan File Retention (days)</Label>
                        <Input
                          type="number"
                          value={Math.round(
                            parseInt(orphanFileRetention) /
                              (1000 * 60 * 60 * 24)
                          )}
                          onChange={(e) =>
                            setOrphanFileRetention(
                              (
                                parseInt(e.target.value) *
                                1000 *
                                60 *
                                60 *
                                24
                              ).toString()
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Scheduled Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the task "
                {selectedTask?.taskName}"? This action cannot be undone.
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
      </SheetContent>
    </Sheet>
  )
}
