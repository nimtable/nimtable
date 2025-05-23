import { CatalogsContent } from "./CatalogsContent"

export default function CatalogsPage() {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <CatalogsContent />
      </div>
    </div>
  )
}
