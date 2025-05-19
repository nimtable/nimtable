import { NamespacesContent } from "./NamespacesContent";

export default function NamespacesPage() {
  return (
      <div className="flex h-full">
        <div className="flex-1 flex flex-col overflow-hidden">
          <NamespacesContent />
        </div>
      </div>
  )
}
