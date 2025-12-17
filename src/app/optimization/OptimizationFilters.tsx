"use client"

import { Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type FiltersProps = {
  optimizationStatus: "all" | "needs_optimization" | "optimized"
  setOptimizationStatus: (
    status: "all" | "needs_optimization" | "optimized"
  ) => void
  fileCount: "all" | "high" | "medium" | "low"
  setFileCount: (count: "all" | "high" | "medium" | "low") => void
}

export function OptimizationFilters({
  optimizationStatus,
  setOptimizationStatus,
  fileCount,
  setFileCount,
}: FiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
      </div>
      <Select
        value={optimizationStatus}
        onValueChange={(value) =>
          setOptimizationStatus(
            value as "all" | "needs_optimization" | "optimized"
          )
        }
      >
        <SelectTrigger className="w-[220px] bg-card border-input">
          <SelectValue placeholder="All Optimization Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Optimization Status</SelectItem>
          <SelectItem value="needs_optimization">Needs Optimization</SelectItem>
          <SelectItem value="optimized">Optimized</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={fileCount}
        onValueChange={(value) =>
          setFileCount(value as "all" | "high" | "medium" | "low")
        }
      >
        <SelectTrigger className="w-[160px] bg-card border-input">
          <SelectValue placeholder="All File Counts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All File Counts</SelectItem>
          <SelectItem value="high">High (1000+)</SelectItem>
          <SelectItem value="medium">Medium (500-999)</SelectItem>
          <SelectItem value="low">Low (&lt; 500)</SelectItem>
        </SelectContent>
      </Select>
      {(optimizationStatus !== "all" || fileCount !== "all") && (
        <Button
          variant="outline"
          onClick={() => {
            setOptimizationStatus("all")
            setFileCount("all")
          }}
          className="bg-card border-input"
        >
          Clear Filters
        </Button>
      )}
    </div>
  )
}
