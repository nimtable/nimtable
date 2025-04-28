import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { UserManagement } from "@/components/users/user-management"

export default function Users() {
  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>
      </div>
      <UserManagement />
    </main>
  )
}
