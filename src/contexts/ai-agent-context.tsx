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

import React, { createContext, useContext, useState, useCallback } from "react"

interface AIAgentContextType {
  isOpen: boolean
  openAgent: () => void
  closeAgent: () => void
  toggleAgent: () => void
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
  const [isOpen, setIsOpen] = useState(false)

  const openAgent = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeAgent = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleAgent = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <AIAgentContext.Provider
      value={{ isOpen, openAgent, closeAgent, toggleAgent }}
    >
      {children}
    </AIAgentContext.Provider>
  )
}
