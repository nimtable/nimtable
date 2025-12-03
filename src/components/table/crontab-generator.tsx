"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { CalendarDays, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CrontabGeneratorProps {
  value: string
  onChange: (cronExpression: string) => void
}

type ScheduleType = "hourly" | "daily" | "weekly" | "monthly" | "custom"

const commonExpressions = {
  "0 */10 * * * *": "Every 10 minutes",
  "0 */30 * * * *": "Every 30 minutes",
  "0 0 * * * *": "Every hour",
  "0 0 */6 * * *": "Every 6 hours",
  "0 0 0 * * *": "Daily at midnight",
  "0 0 2 * * *": "Daily at 2:00 AM",
  "0 0 6 * * *": "Daily at 6:00 AM",
  "0 0 0 * * 0": "Weekly on Sunday",
  "0 0 0 1 * *": "Monthly on 1st day",
  "0 0 9 * * 1-5": "Weekdays at 9:00 AM",
}

export function CrontabGenerator({ value, onChange }: CrontabGeneratorProps) {
  const [scheduleType, setScheduleType] = useState<ScheduleType>("daily")
  const [minute, setMinute] = useState("0")
  const [hour, setHour] = useState("2")
  const [dayOfWeek, setDayOfWeek] = useState("0") // Sunday
  const [dayOfMonth, setDayOfMonth] = useState("1")
  const [customExpression, setCustomExpression] = useState("")

  // Update cron expression when settings change
  useEffect(() => {
    let cronExpression = ""

    // Use default values if empty
    const safeMinute = minute || "0"
    const safeHour = hour || "0"

    switch (scheduleType) {
      case "hourly":
        cronExpression = `0 ${safeMinute} * * * *`
        break
      case "daily":
        cronExpression = `0 ${safeMinute} ${safeHour} * * *`
        break
      case "weekly":
        cronExpression = `0 ${safeMinute} ${safeHour} * * ${dayOfWeek}`
        break
      case "monthly":
        cronExpression = `0 ${safeMinute} ${safeHour} ${dayOfMonth} * *`
        break
      case "custom":
        cronExpression = customExpression
        break
    }

    onChange(cronExpression)
  }, [
    scheduleType,
    minute,
    hour,
    dayOfWeek,
    dayOfMonth,
    customExpression,
    onChange,
  ])

  // Parse existing cron expression when value changes from outside
  useEffect(() => {
    if (value && value !== getGeneratedExpression()) {
      // Check if it's a common expression
      const commonDesc =
        commonExpressions[value as keyof typeof commonExpressions]
      if (commonDesc) {
        parseCronExpression(value)
      } else {
        setScheduleType("custom")
        setCustomExpression(value)
      }
    }
  }, [value])

  const getGeneratedExpression = () => {
    // Use default values if empty
    const safeMinute = minute || "0"
    const safeHour = hour || "0"

    switch (scheduleType) {
      case "hourly":
        return `0 ${safeMinute} * * * *`
      case "daily":
        return `0 ${safeMinute} ${safeHour} * * *`
      case "weekly":
        return `0 ${safeMinute} ${safeHour} * * ${dayOfWeek}`
      case "monthly":
        return `0 ${safeMinute} ${safeHour} ${dayOfMonth} * *`
      case "custom":
        return customExpression
      default:
        return ""
    }
  }

  const parseCronExpression = (expression: string) => {
    const parts = expression.split(" ")
    if (parts.length !== 6) return

    const [sec, min, hr, day, month, dow] = parts

    if (
      sec === "0" &&
      min !== "*" &&
      hr === "*" &&
      day === "*" &&
      month === "*" &&
      dow === "*"
    ) {
      setScheduleType("hourly")
      setMinute(min)
    } else if (
      sec === "0" &&
      min !== "*" &&
      hr !== "*" &&
      day === "*" &&
      month === "*" &&
      dow === "*"
    ) {
      setScheduleType("daily")
      setMinute(min)
      setHour(hr)
    } else if (
      sec === "0" &&
      min !== "*" &&
      hr !== "*" &&
      day === "*" &&
      month === "*" &&
      dow !== "*"
    ) {
      setScheduleType("weekly")
      setMinute(min)
      setHour(hr)
      setDayOfWeek(dow)
    } else if (
      sec === "0" &&
      min !== "*" &&
      hr !== "*" &&
      day !== "*" &&
      month === "*" &&
      dow === "*"
    ) {
      setScheduleType("monthly")
      setMinute(min)
      setHour(hr)
      setDayOfMonth(day)
    }
  }

  const getDescription = () => {
    const expression = getGeneratedExpression()
    if (commonExpressions[expression as keyof typeof commonExpressions]) {
      return commonExpressions[expression as keyof typeof commonExpressions]
    }

    // Use default values if empty
    const safeMinute = minute || "0"
    const safeHour = hour || "0"

    switch (scheduleType) {
      case "hourly":
        return `Every hour at minute ${safeMinute}`
      case "daily":
        return `Daily at ${safeHour.padStart(2, "0")}:${safeMinute.padStart(2, "0")}`
      case "weekly": {
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ]
        return `Weekly on ${dayNames[parseInt(dayOfWeek)]} at ${safeHour.padStart(2, "0")}:${safeMinute.padStart(2, "0")}`
      }
      case "monthly":
        return `Monthly on day ${dayOfMonth} at ${safeHour.padStart(2, "0")}:${safeMinute.padStart(2, "0")}`
      case "custom":
        return "Custom cron expression"
      default:
        return ""
    }
  }

  const isValidCronExpression = (expr: string) => {
    const parts = expr.split(" ")
    if (parts.length !== 6) return false

    // Basic validation for each part
    try {
      const [sec, min, hr, day, month, dow] = parts

      // Validate ranges (basic check)
      if (sec !== "*" && (parseInt(sec) < 0 || parseInt(sec) > 59)) return false
      if (min !== "*" && (parseInt(min) < 0 || parseInt(min) > 59)) return false
      if (hr !== "*" && (parseInt(hr) < 0 || parseInt(hr) > 23)) return false
      if (day !== "*" && (parseInt(day) < 1 || parseInt(day) > 31)) return false
      if (month !== "*" && (parseInt(month) < 1 || parseInt(month) > 12))
        return false
      if (dow !== "*" && (parseInt(dow) < 0 || parseInt(dow) > 6)) return false

      return true
    } catch {
      return false
    }
  }

  const handleTimeInput = (type: "hour" | "minute", value: string) => {
    // Allow direct input of time values
    if (value === "") {
      // Allow empty values for user input
      if (type === "hour") {
        setHour("")
      } else if (type === "minute") {
        setMinute("")
      }
      return
    }

    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      if (type === "hour" && numValue >= 0 && numValue <= 23) {
        setHour(value)
      } else if (type === "minute" && numValue >= 0 && numValue <= 59) {
        setMinute(value)
      }
    }
  }

  return (
    <div className="pt-4 border-t border-border">
      <h4 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Schedule Configuration
      </h4>
      <div className="space-y-6">
        {/* Schedule Type */}
        <div className="space-y-2">
          <label className="text-sm font-normal text-card-foreground block mb-2">
            Schedule Type
          </label>
          <Select
            value={scheduleType}
            onValueChange={(value: ScheduleType) => setScheduleType(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(commonExpressions).map(([expr, desc]) => (
              <Badge
                key={expr}
                variant={value === expr ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onChange(expr)}
              >
                {desc}
              </Badge>
            ))}
          </div>
        </div>

        {/* Schedule Configuration */}
        {scheduleType !== "custom" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Minute */}
              <div className="space-y-2">
                <Label>Minute (0-59)</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => handleTimeInput("minute", e.target.value)}
                  placeholder="0-59"
                />
              </div>

              {/* Hour */}
              {scheduleType !== "hourly" && (
                <div className="space-y-2">
                  <Label>Hour (0-23)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={hour}
                    onChange={(e) => handleTimeInput("hour", e.target.value)}
                    placeholder="0-23"
                  />
                </div>
              )}
            </div>

            {/* Day of Week */}
            {scheduleType === "weekly" && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Day of Month */}
            {scheduleType === "monthly" && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Day {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Custom Expression */}
        {scheduleType === "custom" && (
          <div className="space-y-2">
            <Label>Custom Cron Expression</Label>
            <Input
              value={customExpression}
              onChange={(e) => setCustomExpression(e.target.value)}
              placeholder="0 0 2 * * * (second minute hour day month dayOfWeek)"
              className={
                !isValidCronExpression(customExpression) && customExpression
                  ? "border-red-500"
                  : ""
              }
            />
            <p className="text-xs text-muted-foreground">
              Format: second minute hour day-of-month month day-of-week
            </p>
            {!isValidCronExpression(customExpression) && customExpression && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                Invalid cron expression
              </div>
            )}
          </div>
        )}

        {/* Current Expression and Description */}
        <div className="space-y-2">
          <Label>Generated Expression</Label>
          <div className="rounded-md bg-muted p-3">
            <code className="text-sm font-mono">
              {getGeneratedExpression()}
            </code>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {getDescription()}
          </div>
        </div>
      </div>
    </div>
  )
}
