"use client"

import { useParams } from "next/navigation"
import { Database, Layers, Zap, Mountain, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset } from "@/components/ui/sidebar"
import Image from "next/image"

export default function Page() {
    const params = useParams<{ catalog: string }>()
    const catalog = params?.catalog

    // If no catalog is selected in the URL params, show the welcome screen
    // But we'll still have a catalog selected in the sidebar
    if (!catalog || catalog === "undefined") {
        return (
            <SidebarInset className="bg-gradient-to-b from-background to-muted/20">
                <div className="flex flex-col h-full">
                    {/* Enhanced Header with gradient accent */}
                    <header className="border-b bg-background relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-50 dark:bg-blue-950/20 opacity-50"></div>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                        <div className="relative mx-auto max-w-5xl p-8">
                            <h1 className="text-3xl font-bold mb-3 tracking-tight flex items-center">
                                Welcome to
                                <Image src="/horizontal-light.svg" alt="Nimtable Logo" width={160} height={40} className="h-20 w-auto inline-block -ml-2" />
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-2xl">
                                <span className="font-medium text-foreground">Managed Iceberg Made Simple</span> — Explore and manage
                                your Apache Iceberg tables with an intuitive, powerful interface.
                            </p>
                            {catalog && (
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full text-sm text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                                    <Database className="h-3.5 w-3.5" />
                                    <span>
                                        Active catalog: <strong>{catalog}</strong>
                                    </span>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Main content with improved spacing and visual hierarchy */}
                    <main className="flex-1 p-8 overflow-auto">
                        <div className="mx-auto max-w-5xl">
                            {/* Enhanced Getting started section */}
                            <section className="mb-10">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                    <h2 className="text-xl font-semibold">Getting Started</h2>
                                </div>

                                <Card className="bg-background shadow-md border-muted/60 overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-blue-600"></div>
                                    <CardHeader className="pb-2 pt-6">
                                        <CardTitle className="text-xl">Select a catalog to begin</CardTitle>
                                        <CardDescription className="text-base">
                                            Choose an Iceberg catalog from the dropdown in the sidebar
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-6 mt-2 md:grid-cols-3">
                                            <div className="flex flex-col gap-3 p-4 rounded-lg border border-muted bg-muted/30 transition-colors hover:bg-muted/50">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-lg">
                                                    1
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="font-medium">Open the catalog dropdown</p>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        Click on the dropdown in the sidebar to see your available Iceberg catalogs
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 p-4 rounded-lg border border-muted bg-muted/30 transition-colors hover:bg-muted/50">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-lg">
                                                    2
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="font-medium">Select a catalog</p>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        Choose from your production, development, testing, or analytics catalogs
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 p-4 rounded-lg border border-muted bg-muted/30 transition-colors hover:bg-muted/50">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-lg">
                                                    3
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="font-medium">Browse Iceberg tables</p>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        Navigate through namespaces to access your tables directly in the sidebar
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t pt-5 pb-5 mt-2 bg-muted/10">
                                        <Button
                                            className="relative overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] transform"
                                            onClick={() => window.open("https://www.nimtable.com/", "_blank")}
                                        >
                                            {/* Animated background effect */}
                                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_100%] animate-gradient-x"></div>

                                            {/* Button content with animated icon */}
                                            <div className="relative flex items-center gap-2 px-4 py-2">
                                                <span className="font-medium">Learn more about Nimtable</span>
                                                <ExternalLink className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110" />
                                            </div>

                                            {/* Subtle glow effect */}
                                            <div className="absolute -inset-1 rounded-lg blur-sm bg-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-pulse"></div>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </section>

                            {/* Enhanced Features section */}
                            <section className="mb-8">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                    <h2 className="text-xl font-semibold">Features</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <Card className="bg-background shadow-md border-muted/60 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                                        <CardHeader>
                                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg w-fit mb-3">
                                                <Mountain className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <CardTitle className="text-base">Iceberg Management</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Browse and manage multiple Iceberg catalogs from a single intuitive interface with powerful
                                                controls
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-background shadow-md border-muted/60 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                                        <CardHeader>
                                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg w-fit mb-3">
                                                <Layers className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <CardTitle className="text-base">Hierarchical Navigation</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Easily navigate through nested namespaces and tables in your Iceberg catalogs with our tree view
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-background shadow-md border-muted/60 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                                        <CardHeader>
                                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg w-fit mb-3">
                                                <Zap className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <CardTitle className="text-base">Simplified Operations</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Perform complex Iceberg operations with just a few clicks, no SQL expertise required
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>

                            {/* New section: Quick Tips */}
                            <section>
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                    <h2 className="text-xl font-semibold">Quick Tips</h2>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-5">
                                    <div className="flex gap-4 items-start">
                                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                            <Database className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium mb-1.5">Refresh your catalogs</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Use the refresh button next to the catalog selector to update your data and see the latest
                                                changes.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </main>

                    {/* Enhanced Footer */}
                    <footer className="border-t bg-background py-5 px-8">
                        <div className="mx-auto max-w-5xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <img src="/horizontal-light.svg" alt="Nimtable Logo" className="h-12 w-auto -mr-5" />
                                <p className="text-sm text-muted-foreground">v1.0 — Managed Iceberg Made Simple</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-sm gap-1.5 h-8 hover:bg-muted/80"
                                    onClick={() => window.open("https://www.nimtable.com/docs", "_blank")}
                                >
                                    Documentation
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-sm gap-1.5 h-8 hover:bg-muted/80"
                                    onClick={() => window.open("https://www.nimtable.com/support", "_blank")}
                                >
                                    Github
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </footer>
                </div>
            </SidebarInset>
        )
    }
}
