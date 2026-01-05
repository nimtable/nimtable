/*
 * Copyright 2026 Nimtable
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

import { Bot } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAIAgent } from "@/contexts/ai-agent-context"

export function AIAgentTrigger() {
  const { isOpen, toggleAgent } = useAIAgent()
  const pathname = usePathname()

  // Hide the trigger button when AI agent is open or on login page
  if (isOpen || pathname === "/login") return null

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={toggleAgent}
            size="lg"
            className="h-12 w-12 rounded-full shadow-lg transition-all duration-200 hover:scale-105 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Bot className="h-6 w-6" />
            <span className="sr-only">Toggle AI Copilot</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Open AI agent</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
