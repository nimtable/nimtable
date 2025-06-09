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

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface AIAgentContextType {
  isOpen: boolean
  isFullscreen: boolean
  openAgent: () => void
  closeAgent: () => void
  toggleAgent: () => void
  toggleFullscreen: () => void
}

interface AIAgentState {
  isOpen: boolean
  isFullscreen: boolean
}

const AIAgentContext = createContext<AIAgentContextType | null>(null)

export function useAIAgent() {
  const context = useContext(AIAgentContext)
  if (!context) {
    throw new Error("useAIAgent must be used within an AIAgentProvider")
  }
  return context
}

export function AIAgentProvider({ children }: { children: React.ReactNode }) {
  const [agentState, setAgentState] = useLocalStorage<AIAgentState>(
    "ai-agent-state",
    { isOpen: false, isFullscreen: false }
  )
  const [isInitialized, setIsInitialized] = useState(false)

  // Ensure client-side hydration compatibility
  useEffect(() => {
    setIsInitialized(true)
  }, [])

  // Extract state values
  const { isOpen, isFullscreen } = agentState

  const openAgent = useCallback(() => {
    if (isInitialized) {
      setAgentState((prev) => ({ ...prev, isOpen: true }))
    }
  }, [setAgentState, isInitialized])

  const closeAgent = useCallback(() => {
    if (isInitialized) {
      setAgentState({ isOpen: false, isFullscreen: false })
    }
  }, [setAgentState, isInitialized])

  const toggleAgent = useCallback(() => {
    if (isInitialized) {
      setAgentState((prev) => ({ ...prev, isOpen: !prev.isOpen }))
    }
  }, [setAgentState, isInitialized])

  const toggleFullscreen = useCallback(() => {
    if (isInitialized) {
      setAgentState((prev) => ({ ...prev, isFullscreen: !prev.isFullscreen }))
    }
  }, [setAgentState, isInitialized])

  return (
    <AIAgentContext.Provider
      value={{
        isOpen: isInitialized ? isOpen : false,
        isFullscreen: isInitialized ? isFullscreen : false,
        openAgent,
        closeAgent,
        toggleAgent,
        toggleFullscreen,
      }}
    >
      {children}
    </AIAgentContext.Provider>
  )
}
