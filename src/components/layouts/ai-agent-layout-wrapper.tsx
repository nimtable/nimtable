"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { useAIAgent } from "@/contexts/ai-agent-context"
import { AIAgentSidebar } from "@/components/ai-agent/ai-agent-sidebar"

interface AIAgentLayoutWrapperProps {
  children: React.ReactNode
}

export function AIAgentLayoutWrapper({ children }: AIAgentLayoutWrapperProps) {
  const { isOpen, isFullscreen } = useAIAgent()
  const pathname = usePathname()

  // On login page, don't show AI agent sidebar at all
  if (pathname === "/login") {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen w-full">
      {/* Main content area - hidden in fullscreen mode */}
      <div className={`${isFullscreen ? "hidden" : "flex-1 min-w-0"}`}>
        {children}
      </div>

      {/* AI sidebar - dynamic width and positioning */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? (isFullscreen ? "w-full" : "w-96") : "w-0"
        }`}
      >
        <AIAgentSidebar />
      </div>
    </div>
  )
}
