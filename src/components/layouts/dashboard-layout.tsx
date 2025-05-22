"use client"

import type React from "react"

// import { TableDetail } from "@/components/table-detail"
// import { CopilotPanel } from "@/components/copilot-panel"
import { Sidebar } from "../sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Table Detail Panel */}
      {/* {selectedTable && <TableDetail tableName={selectedTable} onClose={() => setSelectedTable(null)} />} */}

      {/* Copilot Panel */}
      {/* <CopilotPanel isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} selectedTable={selectedTable} /> */}
    </div>
  )
}
