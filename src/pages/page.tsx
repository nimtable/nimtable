import { Navigate } from "react-router-dom"

export default function OverviewPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Welcome to Iceberg Catalog UI</h1>
        <p className="text-gray-600">Select an object from the sidebar to get started.</p>
      </div>
    </div>
  )
}
