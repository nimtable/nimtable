import { NamespacesContent } from "./NamespacesContent"

export default function NamespacesPage() {
  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        <NamespacesContent />
      </div>
    </div>
  )
}
