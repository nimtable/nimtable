import { ChevronRight, MoreVertical, PenSquare } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { Api } from "@/lib/api"
import { useParams } from "react-router-dom"

async function getNamespaces(catalog: string) {
  try {
    const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
    const response = await api.v1.listNamespaces('')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch namespaces: ${response.statusText}`)
    }

    const data = await response.json()
    return data.namespaces as string[][]
  } catch (error) {
    console.error("Error fetching namespaces:", error)
    return []
  }
}

export default function CatalogPage() {
  const [namespaces, setNamespaces] = useState<string[][]>([])
  const { catalog } = useParams<{ catalog: string }>()
  useEffect(() => {
    getNamespaces(catalog!).then(setNamespaces)
  }, [catalog])

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Catalogs
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{catalog}</span>
        </div>
      </div>
      <div className="flex flex-1">
        <div className="flex-1 border-r">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">{catalog}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button>Create Schema</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <PenSquare className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-8">
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="text-sm text-muted-foreground">Main catalog</p>
            </div>
            <div>
              <h2 className="mb-4 text-lg font-semibold">Schemas</h2>
              <div className="mb-4">
                <Input type="search" placeholder="Search" className="max-w-sm" />
              </div>
              <div className="rounded-lg border">
                <div className="grid grid-cols-2 gap-4 border-b px-6 py-3 font-medium">
                  <div>Name</div>
                  <div>Created At</div>
                </div>
                <div className="divide-y">
                  {namespaces.map(([namespace]) => (
                    <div key={namespace} className="grid grid-cols-2 gap-4 px-6 py-3">
                      <div>
                        <Link 
                          to={`/${catalog}/${namespace}`} 
                          className="text-blue-600 hover:underline"
                        >
                          {namespace}
                        </Link>
                      </div>
                      <div>-</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-80 p-6">
          <h2 className="mb-4 text-lg font-semibold">Catalog details</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created at</dt>
              <dd className="text-sm">-</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

