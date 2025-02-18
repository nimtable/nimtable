import { ChevronRight, MoreVertical, PenSquare } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CatalogAPIApiFp } from "@/lib/openapi/api"
import { useEffect, useState } from "react"

interface CatalogPageProps {
  params: {
    catalog: string
  }
}

async function getNamespaces(catalog: string) {
  try {
    const api = CatalogAPIApiFp()
    const fetchNamespaces = api.listNamespaces('')
    const response = await fetchNamespaces(fetch, `/api/catalog/${catalog}`)
    
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

export default async function CatalogPage({ params }: CatalogPageProps) {
  const [namespaces, setNamespaces] = useState<string[][]>([])
  useEffect(() => {
    getNamespaces(params.catalog).then(setNamespaces)
  }, [params.catalog])

  if (!namespaces.length) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Catalogs
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{params.catalog}</span>
        </div>
      </div>
      <div className="flex flex-1">
        <div className="flex-1 border-r">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">{params.catalog}</h1>
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
                          href={`/${params.catalog}/${namespace}`} 
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

