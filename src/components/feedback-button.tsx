"use client"

import { MessageSquare, Github } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function FeedbackButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
          "text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
        )}
      >
        <MessageSquare className="h-4 w-4" />
        Submit Feedback
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem asChild>
          <a
            href="https://go.nimtable.com/slack"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Join Slack Community
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="https://github.com/nimtable/nimtable/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center cursor-pointer"
          >
            <Github className="h-4 w-4 mr-2" />
            Report Bug or Feature Request
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
