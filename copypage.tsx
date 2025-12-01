import { Search, Bell, ChevronDown, FileText, MessageSquare, ArrowLeft, Play, RefreshCw, Download, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BreadcrumbTooltip } from "@/components/breadcrumb-tooltip"
import { UserIcon } from "@/components/ui/user-icon"

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

const sampleData = [
  { id: "547334433276903400", rowId: 2229, itemName: "dRCFluVBr", description: "dRCFluVBr", initialBid: 9138, reserve: 9138, dateTime: "[2025,5,28,9,49,48,776900000]" },
  { id: "547334433276907500", rowId: 2230, itemName: "j4CHbfIuGI", description: "j4CHbfIuGI", initialBid: 28878, reserve: 28878, dateTime: "[2025,5,19,19,22,12,131600000]" },
  { id: "547334433276911600", rowId: 2231, itemName: "9sidZcrbgu", description: "9sidZcrbgu", initialBid: 22970, reserve: 22970, dateTime: "[2025,5,19,23,41,48,716000000]" },
  { id: "547334433276915700", rowId: 2232, itemName: "gJ7yqhnnZT", description: "gJ7yqhnnZT", initialBid: 5113, reserve: 5113, dateTime: "[2025,5,28,12,46,32,318000000]" },
  { id: "547334433276919800", rowId: 2297, itemName: "uMqvAWOqVY", description: "uMqvAWOqVY", initialBid: 6517, reserve: 6517, dateTime: "[2025,5,28,11,44,58,789000000]" },
  { id: "547334433276923900", rowId: 2298, itemName: "ifUL3TQuJE", description: "ifUL3TQuJE", initialBid: 23402, reserve: 23402, dateTime: "[2025,5,19,23,22,49,907900000]" },
  { id: "547334433276928000", rowId: 2235, itemName: "NsLQCKiXko", description: "NsLQCKiXko", initialBid: 22548, reserve: 22548, dateTime: "[2025,5,28,8,8,21,565900000]" },
  { id: "547334433276932100", rowId: 2300, itemName: "DrEHWFj8De", description: "DrEHWFj8De", initialBid: 22334, reserve: 22334, dateTime: "[2025,5,28,9,9,46,500900000]" },
  { id: "547334433276936200", rowId: 2237, itemName: "1O0ZZ4Tcxs", description: "1O0ZZ4Tcxs", initialBid: 7174, reserve: 7174, dateTime: "[2025,5,28,11,15,57,049000000]" },
  { id: "547334433276940300", rowId: 2238, itemName: "sL0pRw77b1", description: "sL0pRw77b1", initialBid: 5773, reserve: 5773, dateTime: "[2025,5,28,12,17,31,930000000]" },
]

export default function TableDetailsPreviewPage() {
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
                  Namespaces
                </a>
              </BreadcrumbTooltip>
              <span className="text-muted-foreground">/</span>
              <BreadcrumbTooltip tooltip="Tables">
                <a href="/tables" className="text-primary hover:text-primary/80">
                  Tables
                </a>
              </BreadcrumbTooltip>
              <span className="text-muted-foreground">/</span>
              <BreadcrumbTooltip tooltip="Table details">
                <span>Table details</span>
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
                  <DropdownMenuItem>
                    <a href="/login">Logout</a>
                  </DropdownMenuItem>
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
               
              </div>
            </div>

            {/* Tabs */}
            <div className="py-3">
              <div className="tabs-nav px-6">
                <a href="/table-details-info" className="tab-item pl-0">Info</a>
                <button className="tab-item-active">Data preview</button>
                <a href="/table-details-version" className="tab-item">Version control</a>
              </div>
            </div>

            {/* Sample Data Section */}
            <div className="p-6 space-y-4 bg-[#fafafa]">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TableIcon className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold text-card-foreground">Sample Data</h3>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter results..."
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">Showing 10 of 10 rows</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">_risingwave_iceberg_row_id</th>
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">id</th>
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">item_name</th>
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">description</th>
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">initial_bid</th>
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">reserve</th>
                        <th className="text-left py-3 px-4 text-sm font-normal text-muted-foreground">date_time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.map((row, index) => (
                        <tr key={index} className="border-b border-border hover:bg-table-row-hover">
                          <td className="py-3 px-4 text-sm text-card-foreground">{row.rowId}</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">{row.id}</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">{row.itemName}</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">{row.description}</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">{row.initialBid}</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">{row.reserve}</td>
                          <td className="py-3 px-4 text-sm text-card-foreground">{row.dateTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">Showing 1 to 10 of 5100 rows</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rows per page</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" className="gap-2">
                            10
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>10</DropdownMenuItem>
                          <DropdownMenuItem>25</DropdownMenuItem>
                          <DropdownMenuItem>50</DropdownMenuItem>
                          <DropdownMenuItem>100</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Page 1 of 510</span>
                      <div className="flex items-center gap-1">
                        <Button variant="secondary" size="sm" disabled>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" disabled>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
