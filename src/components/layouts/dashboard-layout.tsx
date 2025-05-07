"use client"

import type React from "react"
import { useState } from "react"

// import { TableDetail } from "@/components/table-detail"
// import { CopilotPanel } from "@/components/copilot-panel"
import { Sidebar } from "../sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)

  // Create a context that can be used by child components
  const openTableDetail = (tableName: string) => {
    setSelectedTable(tableName)
  }

  const openCopilot = () => {
    setIsCopilotOpen(true)
  }

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Table Detail Panel */}
      {/* {selectedTable && <TableDetail tableName={selectedTable} onClose={() => setSelectedTable(null)} />} */}

      {/* Copilot Panel */}
      {/* <CopilotPanel isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} selectedTable={selectedTable} /> */}
    </div>
  )
}
