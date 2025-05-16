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
import { Home, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SqlEditorNavbar() {
  return (
    <div className="border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <TooltipProvider delayDuration={300}>
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
          </TooltipProvider>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-md">
              <FileCode className="h-4 w-4 text-blue-500" />
            </div>
            <span className="font-medium">SQL Workspace</span>
          </div>
        </div>
      </div>
    </div>
  )
}
