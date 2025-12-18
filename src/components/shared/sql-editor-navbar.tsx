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

import Link from "next/link"
import { Home, FileCode, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SqlEditorNavbarProps {
  title?: string
  icon?: "sql" | "ai"
}

export function SqlEditorNavbar({
  title = "SQL Workspace",
  icon = "sql",
}: SqlEditorNavbarProps) {
  const IconComponent = icon === "ai" ? Bot : FileCode
  const iconColor = "text-primary"
  const bgColor = "bg-primary/10"

  return (
    <div className="border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-muted-foreground/20"
                asChild
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Go to dashboard</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Go to dashboard</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2">
            <div className={`p-1.5 ${bgColor} rounded-md`}>
              <IconComponent className={`h-4 w-4 ${iconColor}`} />
            </div>
            <span className="font-medium">{title}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
