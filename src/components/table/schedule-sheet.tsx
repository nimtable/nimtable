"use client"

import { Calendar, Plus } from "lucide-react"
import { CrontabGenerator } from "@/components/table/crontab-generator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

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
  const [cronExpression, setCronExpression] = useState("0 0 2 * * *")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col p-0 sm:max-w-full"
      >
        <div className="border-b bg-background">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="font-medium text-foreground">Schedule Compaction</span>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Tasks for {table}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CrontabGenerator
                value={cronExpression}
                onChange={setCronExpression}
              />
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
