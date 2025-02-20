// Move the existing page.tsx content here and update it
import { ChevronRight, MoreVertical, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SchemaPageProps {
  params: {
    catalog: string
    schema: string
  }
}

export default function SchemaPage({ params }: SchemaPageProps) {
  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Catalogs
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/catalog/${params.catalog}`} className="hover:text-foreground">
            {params.catalog}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{params.schema}</span>
        </div>
      </div>
      <div className="flex flex-1">
        <div className="flex-1 border-r">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">{`${params.catalog}.${params.schema}`}</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="p-6">
            <div className="mb-8">
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="text-sm text-muted-foreground">Managed table</p>
            </div>
            <div>
              <h2 className="mb-4 text-lg font-semibold">Columns</h2>
              <div className="mb-4">
                <Input type="search" placeholder="Search" className="max-w-sm" />
              </div>
              <div className="rounded-lg border">
                <div className="grid grid-cols-2 gap-4 border-b px-6 py-3 font-medium">
                  <div>Name</div>
                  <div>Type</div>
                </div>
                <div className="divide-y">
                  <div className="grid grid-cols-2 gap-4 px-6 py-3">
                    <div>id</div>
                    <div>INT</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 px-6 py-3">
                    <div>name</div>
                    <div>STRING</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 px-6 py-3">
                    <div>marks</div>
                    <div>INT</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-80 p-6">
          <h2 className="mb-4 text-lg font-semibold">Table details</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created at</dt>
              <dd className="text-sm">07/17/2024, 18:40:05</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Updated at</dt>
              <dd className="text-sm">07/17/2024, 18:40:05</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Data source format</dt>
              <dd>
                <Badge variant="secondary">DELTA</Badge>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

