'use client'

import { Search, Bell, ChevronDown, FileText, MessageSquare, ArrowLeft, Play, RefreshCw, Download, Plus, Sparkles, Pencil, Info, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BreadcrumbTooltip } from "@/components/breadcrumb-tooltip"
import { UserIcon } from "@/components/ui/user-icon"

const schemaFields = [
  {
    name: "id",
    type: "uuid",
    nullPercent: "0%",
    isPrimaryKey: true,
    description: "Unique identifier for each record",
  },
  {
    name: "product_id",
    type: "uuid",
    nullPercent: "2%",
    isPrimaryKey: false,
    description:
      "Reference to the product table to the product table to the product table to the product table the product table t...",
  },
  {
    name: "price",
    type: "decimal(10,2)",
    nullPercent: "0%",
    isPrimaryKey: false,
    description: "Number of items ordered",
  },
  {
    name: "quantity",
    type: "integer",
    nullPercent: "0%",
    isPrimaryKey: false,
    description: "Price per unit at time of order",
  },
]

function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M64 256V160H224v96H64zm0 64H224v96H64V320zm224 96V320H448v96H288zM448 256H288V160H448v96zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64z" />
    </svg>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64z" />
    </svg>
  )
}

function ScrewdriverWrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.1-20.7-3.2-30.5c-2.4-11.2-16.1-14.1-24.2-6l-63.9 63.9c-3 3-7.1 4.7-11.3 4.7H352c-8.8 0-16-7.2-16-16V102.6c0-4.2 1.7-8.3 4.7-11.3l63.9-63.9c8.1-8.1 5.2-21.8-6-24.2C388.7 1.1 378.5 0 368 0C288.5 0 224 64.5 224 144l0 .8 85.3 85.3c36-9.1 75.8 .5 104 28.7L429 274.5c49-23 83-72.8 83-130.5zM56 432a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z" />
    </svg>
  )
}

export default function TableDetailsPage() {
  const [showOptimizationModal, setShowOptimizationModal] = useState(false)
  const [executionMode, setExecutionMode] = useState<'run-once' | 'schedule'>('run-once')
  const [tableContext, setTableContext] = useState('')
  const [isEditingContext, setIsEditingContext] = useState(false)

  const handleSaveContext = () => {
    setIsEditingContext(false)
    // Here you would typically save to backend
    console.log('[v0] Saved table context:', tableContext)
  }

  const handleCancelContext = () => {
    setIsEditingContext(false)
    // Optionally reset to original value if you track it
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[140px] bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4">
          <img src="/nimtable-logo.svg" alt="Nimtable" className="w-auto h-6" />
        </div>

        <nav className="flex-1 px-0">
          <a
            href="/catalog"
            className="block px-3 py-2 text-sm text-sidebar-foreground bg-primary/10 border-r-[3px] border-primary font-bold"
          >
            Catalogs
          </a>
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <a
            href="#"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded"
          >
            <FileText className="w-4 h-4" />
            <span>Docs</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Slack</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top header with breadcrumb */}
        <header className="bg-card border-b border-border">
          <div className="flex items-center justify-between px-6 h-14 text-[rgba(250,250,250,1)] bg-[rgba(250,250,250,1)]">
            <div className="flex items-center gap-3 text-sm font-normal text-card-foreground">
              <BreadcrumbTooltip tooltip="Catalogs">
                <a href="/catalog" className="text-primary hover:text-primary/80">
                  Catalogs
                </a>
              </BreadcrumbTooltip>
              <span className="text-muted-foreground">/</span>
              <BreadcrumbTooltip tooltip="Namespaces">
                <a href="/tables" className="text-primary hover:text-primary/80">
                  analytics_catalog
                </a>
              </BreadcrumbTooltip>
              <span className="text-muted-foreground">/</span>
              <BreadcrumbTooltip tooltip="Tables">
                <a href="/tables" className="text-primary hover:text-primary/80">
                  analytics
                </a>
              </BreadcrumbTooltip>
              <span className="text-muted-foreground">/</span>
              <BreadcrumbTooltip tooltip="Table details">
                <span>analytics_events</span>
              </BreadcrumbTooltip>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <UserIcon className="w-4 h-4" />
                    <span>AdminUser@org.com</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Catalog, namespace, and table selector with search bar */}
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-input">
                  <FolderIcon className="w-4 h-4" />
                  analytics_catalog
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>analytics_catalog</DropdownMenuItem>
                <DropdownMenuItem>nimtable_catalog</DropdownMenuItem>
                <DropdownMenuItem>staging_catalog</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-input">
                  <FolderIcon className="w-4 h-4" />
                  analytics
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>analytics</DropdownMenuItem>
                <DropdownMenuItem>reporting</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-input">
                  <TableIcon className="w-4 h-4" />
                  analytics_events
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>analytics_events</DropdownMenuItem>
                <DropdownMenuItem>user_sessions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tables..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Table section with tabs */}
        <div className="flex-1 p-0 text-card bg-[rgba(255,255,255,1)]">
          <div className="bg-card">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <a href="/tables" className="text-primary hover:text-primary/80 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </a>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-5 h-5 text-card-foreground" />
                    <h2 className="text-m font-normal text-card-foreground">analytics_events</h2>
                  </div>
                  <span className="px-2 py-1 text-xs font-normal bg-muted text-muted-foreground rounded">
                    Table details
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <button onClick={() => setShowOptimizationModal(true)} className="btn-secondary">
                  <ScrewdriverWrenchIcon className="w-4 h-4" />
                  <span>Optimize table</span>
                </button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Plus className="w-4 h-4" />
                  <span>SQL query</span>
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="py-3">
              <div className="tabs-nav px-6">
                <button className="tab-item pl-0">Info</button>
                <a href="/table-details-preview" className="tab-item">Data preview</a>
                <button className="tab-item">Version control</button>
              </div>
            </div>

            <div className="p-6 space-y-6 bg-[#fafafa]">
              {/* File Size Distribution Card */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-card-foreground">File Size Distribution</h3>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-muted-foreground hover:text-card-foreground cursor-help" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
                        Current distribution of file sizes in the table
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-success" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/>
                    </svg>
                    <span className="text-success font-normal">Healthy</span>
                  </div>
                </div>

                <div className="grid grid-cols-[5fr_5fr] gap-8 mt-6">
                  {/* Left side: Three file type groups in horizontal layout with visual grouping */}
                  <div className="border border-border rounded-lg p-6 bg-muted/20">
                    <div className="flex gap-8 justify-around">
                      {/* Data Files */}
                      <div className="flex flex-col items-center">
                        <h4 className="text-sm font-normal text-card-foreground mb-4 text-center">Data Files</h4>
                        <div className="flex flex-col gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-card-foreground">1</div>
                            <div className="text-xs text-muted-foreground">Files</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-card-foreground">0.23 MB</div>
                            <div className="text-xs text-muted-foreground">Size</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-card-foreground">5,100</div>
                            <div className="text-xs text-muted-foreground">Records</div>
                          </div>
                        </div>
                      </div>

                      {/* Position Delete Files */}
                      <div className="flex flex-col items-center">
                        <h4 className="text-sm font-normal text-card-foreground mb-4 text-center">Position Delete Files</h4>
                        <div className="flex flex-col gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-card-foreground">0</div>
                            <div className="text-xs text-muted-foreground">Files</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-card-foreground">0.00 MB</div>
                            <div className="text-xs text-muted-foreground">Size</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-card-foreground">0</div>
                            <div className="text-xs text-muted-foreground">Records</div>
                          </div>
                        </div>
                      </div>

                      {/* Equality Delete Files */}
                      <div className="flex flex-col items-center">
                        <h4 className="text-sm font-normal text-card-foreground mb-4 text-center">Equality Delete Files</h4>
                        <div className="flex flex-col gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-card-foreground">0</div>
                            <div className="text-xs text-muted-foreground">Files</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-card-foreground">0.00 MB</div>
                            <div className="text-xs text-muted-foreground">Size</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-card-foreground">0</div>
                            <div className="text-xs text-muted-foreground">Records</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side: File size distribution chart */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-normal text-card-foreground">Total Files: 1</span>
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span className="text-card-foreground">0-8M</span>
                          </div>
                          <span className="text-muted-foreground">1 files (100%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-muted"></div>
                            <span className="text-card-foreground">8M-32M</span>
                          </div>
                          <span className="text-muted-foreground">0 files (0%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full"></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-muted"></div>
                            <span className="text-card-foreground">32M-128M</span>
                          </div>
                          <span className="text-muted-foreground">0 files (0%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full"></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-muted"></div>
                            <span className="text-card-foreground">128M-512M</span>
                          </div>
                          <span className="text-muted-foreground">0 files (0%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full"></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-muted"></div>
                            <span className="text-card-foreground">512M+</span>
                          </div>
                          <span className="text-muted-foreground">0 files (0%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full"></div>
                      </div>
                    </div>
                    <div className="mt-6 p-3 bg-muted rounded">
                      <p className="text-sm font-normal text-card-foreground mb-1">Optimization Recommendation:</p>
                      <p className="text-sm text-muted-foreground">This table's file distribution is optimal and does not require optimization at this time.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Table Content Card */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="text-base font-semibold text-card-foreground">Table Context</h3>
                    </div>
                    <Button variant="secondary" className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Generate
                    </Button>
                  </div>
                  
                  <div>
                    <div className="relative">
                      <textarea
                        value={tableContext}
                        onChange={(e) => setTableContext(e.target.value)}
                        onFocus={() => setIsEditingContext(true)}
                        placeholder="Write a summary for this table or click 'AI Generate' to generate one"
                        className="w-full p-4 border border-border rounded bg-muted/30 text-sm text-card-foreground placeholder:text-muted-foreground placeholder:italic min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {isEditingContext && (
                        <div className="flex justify-end gap-2 mt-3">
                          <Button onClick={handleCancelContext} variant="secondary">
                            Cancel
                          </Button>
                          <Button onClick={handleSaveContext} className="gap-2">
                            <Check className="w-4 h-4" />
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table Information Card */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TableIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold text-card-foreground">Table Information</h3>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-muted-foreground hover:text-card-foreground cursor-help" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
                        UUID
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <code className="text-sm font-mono text-card-foreground">b17380933-a818-4ef1-9177-7e80736910b7c</code>
                    <button className="text-muted-foreground hover:text-card-foreground">
                      <CopyIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Schema Card */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7h16M4 12h16M4 17h16"/>
                  </svg>
                  <h3 className="text-base font-semibold text-card-foreground">Table Schema</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schemaFields.map((field, index) => (
                        <tr key={index} className="border-b border-border hover:bg-table-row-hover">
                          <td className="py-3 px-4 text-sm text-card-foreground">{index + 1}</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">{field.name}</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">{field.type}</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">{field.nullPercent === "0%" ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Partition Specs Card */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <h3 className="text-base font-semibold text-card-foreground">Partition Specs</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">Spec ID</th>
                          <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">Fields</th>
                          <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                              <span className="text-sm text-card-foreground">4229352543855962739</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-card-foreground">May 20, 7:37 PM</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">Optimization</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Properties Card */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TableIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold text-card-foreground">Properties</h3>
                  </div>
                  <div className="grid gap-6">
                    <div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-left">
                          <div className="flex items-center gap-1 mb-1">
                            <div className="text-xs text-muted-foreground">write.parquet.compression-codec</div>
                            <div className="relative group">
                              <Info className="w-3 h-3 text-muted-foreground hover:text-card-foreground cursor-help" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
                                placeholder text
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-x font-semibold text-card-foreground">zstd</div>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Modal Overlay */}
        {showOptimizationModal && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8 overflow-hidden">
              <div className="bg-card rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-xl">
                  <h2 className="text-lg font-semibold text-card-foreground">Table Optimization</h2>
                  <button
                    onClick={() => setShowOptimizationModal(false)}
                    className="text-muted-foreground hover:text-card-foreground"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <div className="overflow-y-auto flex-1">
                  <div className="p-6 space-y-6">
                    {/* Execution Mode */}
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground mb-3">Execution Mode</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setExecutionMode('run-once')}
                          className={`p-4 border-2 rounded-lg text-left ${
                            executionMode === 'run-once' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Play className={`w-5 h-5 ${executionMode === 'run-once' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="font-semibold text-card-foreground">Run Once</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Execute optimization immediately</p>
                        </button>
                        <button 
                          onClick={() => setExecutionMode('schedule')}
                          className={`p-4 border-2 rounded-lg text-left ${
                            executionMode === 'schedule' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <svg className={`w-5 h-5 ${executionMode === 'schedule' ? 'text-primary' : 'text-muted-foreground'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <span className="font-semibold text-card-foreground">Schedule</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Set up automated optimization</p>
                        </button>
                      </div>
                    </div>

                    {executionMode === 'run-once' ? (
                      <>
                        {/* Optimization Settings */}
                        <div>
                          <h3 className="text-sm font-semibold text-card-foreground mb-4">Optimization Settings</h3>
                          
                          {/* Snapshot retention */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-sm font-normal text-card-foreground">Snapshot retention</p>
                                <p className="text-xs text-muted-foreground">Removing old snapshots</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                            
                            <div className="ml-4 space-y-4">
                              <div>
                                <label className="text-sm text-muted-foreground block mb-2">Retention period (days)</label>
                                <input 
                                  type="number" 
                                  defaultValue="5"
                                  className="w-full px-3 py-2 border border-input rounded-md bg-card text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground block mb-2">Minimum snapshots to retain</label>
                                <input 
                                  type="number" 
                                  defaultValue="1"
                                  className="w-full px-3 py-2 border border-input rounded-md bg-card text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Optimization */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-sm font-normal text-card-foreground">Optimization</p>
                                <p className="text-xs text-muted-foreground">Combine small data files into larger files.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                            
                            <div className="ml-4 space-y-4">
                              <div>
                                <label className="text-sm text-muted-foreground block mb-2">Target file size (MB)</label>
                                <input 
                                  type="number" 
                                  defaultValue="512"
                                  className="w-full px-3 py-2 border border-input rounded-md bg-card text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground block mb-2">Strategy</label>
                                <select className="w-full px-3 py-2 border border-input rounded-md bg-card text-sm">
                                  <option>Binpack</option>
                                  <option>Sort</option>
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">Choose between binpack (default) or sort strategy</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground block mb-2">Where Clause</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g., id > 1000"
                                  className="w-full px-3 py-2 border border-input rounded-md bg-card text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Optional filter to specify which files should be rewritten</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* System Resources */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="3" width="20" height="14" rx="2"/>
                              <line x1="8" y1="21" x2="16" y2="21"/>
                              <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                            <h3 className="text-sm font-semibold text-card-foreground">System Resources</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="4" y="4" width="16" height="16" rx="2"/>
                                <rect x="9" y="9" width="6" height="6"/>
                                <line x1="9" y1="1" x2="9" y2="4"/>
                                <line x1="15" y1="1" x2="15" y2="4"/>
                                <line x1="9" y1="20" x2="9" y2="23"/>
                                <line x1="15" y1="20" x2="15" y2="23"/>
                                <line x1="20" y1="9" x2="23" y2="9"/>
                                <line x1="20" y1="14" x2="23" y2="14"/>
                                <line x1="1" y1="9" x2="4" y2="9"/>
                                <line x1="1" y1="14" x2="4" y2="14"/>
                              </svg>
                              <div>
                                <p className="text-2xl font-semibold text-card-foreground">12</p>
                                <p className="text-xs text-muted-foreground">CPU Cores</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 7h20M2 12h20M2 17h20"/>
                                <rect x="5" y="3" width="14" height="18" rx="2"/>
                              </svg>
                              <div>
                                <p className="text-2xl font-semibold text-card-foreground">32.0 GB</p>
                                <p className="text-xs text-muted-foreground">Max Memory</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <p className="text-sm text-yellow-800">
                              Optimization is performed using Embedded Spark with the above system resources. Please ensure these resources are sufficient for your data size.
                            </p>
                          </div>
                        </div>

                        {/* Optimization History */}
                        <div>
                          <h3 className="text-sm font-semibold text-card-foreground mb-4">Optimization History</h3>
                          <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted/30">
                                <tr>
                                  <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">Snapshot ID</th>
                                  <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">Date</th>
                                  <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">Operation</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t border-border hover:bg-muted/20">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                                      <span className="text-sm text-card-foreground font-mono">4229352543855962739</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-card-foreground">May 20, 7:37 PM</td>
                                  <td className="py-3 px-4 text-sm text-card-foreground">Optimization</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Current Scheduled Tasks */}
                        <div>
                          <h3 className="text-sm font-semibold text-card-foreground mb-4">Current Scheduled Tasks</h3>
                          
                          <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-normal text-card-foreground">s3-tables-catalog-demo_public_datagen_t_optimization</span>
                                  <span className="px-2 py-0.5 bg-gray-800 text-white text-xs rounded">Enabled</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div>
                                    <span className="mr-1">Schedule:</span>
                                    <span className="font-mono">0 2 * * *</span>
                                  </div>
                                  <div>
                                    <span className="mr-1">Next Run:</span>
                                    <span>Nov 8, 10:00 AM</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" defaultChecked />
                                  <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                                <button className="text-muted-foreground hover:text-red-600">
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Schedule Configuration */}
                        <div>
                          <h3 className="text-sm font-semibold text-card-foreground mb-4">Schedule Configuration</h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-normal text-card-foreground block mb-2">Task Name</label>
                              <input 
                                type="text" 
                                defaultValue="s3-tables-catalog-demo_public_datagen_t_optimization"
                                className="w-full px-3 py-2 border border-input rounded-md bg-card text-sm"
                              />
                            </div>

                            <div className="flex items-center justify-between py-2">
                              <div>
                                <p className="text-sm font-normal text-card-foreground">Enable Task</p>
                                <p className="text-xs text-muted-foreground">Whether this task should run automatically</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>

                            <div className="pt-4 border-t border-border">
                              <h4 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                Schedule Configuration
                              </h4>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-normal text-card-foreground block mb-2">Schedule Type</label>
                                  <select className="w-full px-3 py-2 border border-input rounded-md bg-card text-sm">
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                    <option>Custom</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-sm font-normal text-card-foreground block mb-2">Quick Presets</label>
                                  <div className="border border-border rounded-md p-2 bg-muted/30">
                                    <div className="h-8 flex items-center">
                                      <span className="text-sm text-muted-foreground">Select a preset schedule</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-card flex-shrink-0 rounded-b-xl">
                  <Button variant="outline" onClick={() => setShowOptimizationModal(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {executionMode === 'run-once' ? 'Run Optimization' : 'Save Schedule'}
                  </Button>
                </div>
              </div>
            </div>
            <style jsx global>{`
              body {
                overflow: hidden;
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  )
}
