/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Database,
  BarChart3,
  ExternalLink,
  Layers,
  Gauge,
  Plus,
  ArrowRight,
} from "lucide-react"
import { SidebarInset } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import Image from "next/image"

const Page = () => {
  const params = useParams<{ catalog: string }>()
  const catalog = params?.catalog

  // If no catalog is selected in the URL params, show the welcome screen
  // But we'll still have a catalog selected in the sidebar
  if (!catalog || catalog === "undefined") {
    return (
      <SidebarInset className="bg-gradient-to-b from-background to-muted/20">
        <div className="flex h-full flex-col">
          {/* Enhanced Header with gradient accent */}
          <header className="relative overflow-hidden border-b bg-background">
            <div className="absolute inset-0 bg-blue-50 opacity-50 dark:bg-blue-950/20"></div>
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <div className="relative mx-auto max-w-5xl p-8">
              <h1 className="mb-3 flex items-center text-3xl font-bold tracking-tight">
                Welcome to
                <Image
                  src="/horizontal-light.svg"
                  alt="Nimtable Logo"
                  width={160}
                  height={40}
                  className="-ml-2 inline-block h-20 w-auto"
                />
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                <span className="font-medium text-foreground">
                  Managed Iceberg Made Simple
                </span>{" "}
                — Explore and manage your Apache Iceberg tables with an
                intuitive, powerful interface.
              </p>
              {catalog && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300">
                  <Database className="h-3.5 w-3.5" />
                  <span>
                    Active catalog: <strong>{catalog}</strong>
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* Main content with improved spacing and visual hierarchy */}
          <main className="flex-1 overflow-auto p-8">
            <div className="mx-auto max-w-5xl">
              {/* Enhanced Getting started section */}
              <section className="mb-10">
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                  <h2 className="text-xl font-semibold">Getting Started</h2>
                </div>

                <Card className="overflow-hidden border-muted/60 bg-background shadow-md">
                  <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-blue-400 to-blue-600"></div>
                  <CardHeader className="pb-2 pt-6">
                    <CardTitle className="text-xl">
                      Connect to your Iceberg catalogs
                    </CardTitle>
                    <CardDescription className="text-base">
                      Set up a connection to your Iceberg catalog to start
                      managing your data lake
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2 grid gap-6 md:grid-cols-3">
                      <div className="flex flex-col gap-3 rounded-lg border border-muted bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                          1
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-medium">
                            Create a catalog connection
                          </p>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            Configure a connection to your REST, JDBC, S3
                            Tables, or AWS Glue catalog
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 rounded-lg border border-muted bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                          2
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-medium">Browse namespaces</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            Navigate through your catalog&apos;s namespaces to
                            access your Iceberg tables
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 rounded-lg border border-muted bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                          3
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-medium">Manage your tables</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            View schema, query data, and optimize your Iceberg
                            tables with built-in tools
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-center pb-6">
                    <div className="flex w-full max-w-lg flex-col items-center">
                      {/* Action buttons container */}
                      <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
                        {/* Primary action - Create Catalog Connection */}
                        <div className="relative w-auto max-w-xs rounded-xl bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 p-1">
                          <Button
                            className="group relative h-12 w-auto transform overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                            onClick={() =>
                              (window.location.href = "/data/catalog/new")
                            }
                          >
                            {/* Animated shine effect */}
                            <div className="absolute -left-[100%] top-0 h-full w-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-1000 ease-in-out group-hover:left-[100%]"></div>

                            {/* Button content with animated icon */}
                            <div className="relative flex items-center justify-center gap-3">
                              <div className="rounded-full bg-white/20 p-1.5">
                                <Plus className="h-5 w-5" />
                              </div>
                              <span className="text-base font-semibold tracking-wide">
                                Create Catalog Connection
                              </span>
                            </div>
                          </Button>
                        </div>

                        {/* Secondary action - Learn more link */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-sm text-blue-600 hover:bg-blue-50/50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                          onClick={() =>
                            window.open("https://www.nimtable.com/", "_blank")
                          }
                        >
                          Learn more about Nimtable
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </section>

              {/* Updated Features section */}
              <section className="mb-8">
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                  <h2 className="text-xl font-semibold">Features</h2>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {/* Feature 1: Simplify Iceberg Operations */}
                  <Card className="overflow-hidden border-muted/60 bg-background shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                    <CardHeader>
                      <div className="mb-3 w-fit rounded-lg bg-blue-50 p-2.5 dark:bg-blue-950/30">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">
                        Simplify Iceberg Operations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Streamline Apache Iceberg management with intuitive
                        dashboards and real-time monitoring. Reduce complexity
                        and save time.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Feature 2: Visual Catalog Explorer */}
                  <Card className="overflow-hidden border-muted/60 bg-background shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                    <CardHeader>
                      <div className="mb-3 w-fit rounded-lg bg-blue-50 p-2.5 dark:bg-blue-950/30">
                        <Layers className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">
                        Visual Catalog Explorer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Visually navigate your data lake&apos;s metadata and
                        schema. Gain instant insights into your Iceberg tables
                        without writing queries.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Feature 3: Compaction-as-a-Service */}
                  <Card className="overflow-hidden border-muted/60 bg-background shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                    <CardHeader>
                      <div className="mb-3 w-fit rounded-lg bg-blue-50 p-2.5 dark:bg-blue-950/30">
                        <Gauge className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">
                        Compaction-as-a-Service
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Automatically optimize table performance and reduce
                        storage costs with intelligent file compaction and
                        management.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* New section: Quick Tips */}
              <section>
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                  <h2 className="text-xl font-semibold">Quick Tips</h2>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-blue-100 p-2.5 dark:bg-blue-900/50">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="mb-1.5 font-medium">
                        Multiple catalog types supported
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Nimtable supports various Iceberg catalog
                        implementations including REST API, JDBC, AWS Glue, and
                        S3 Tables. Configure your connection based on your
                        infrastructure.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>

          {/* Enhanced Footer */}
          <footer className="border-t bg-background px-8 py-5">
            <div className="mx-auto flex max-w-5xl flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <Image
                  src="/horizontal-light.svg"
                  alt="Nimtable Logo"
                  width={120}
                  height={24}
                  className="-mr-5 -mt-[2px] h-10 w-auto"
                />
                <p className="text-sm text-muted-foreground">
                  v1.0 — Managed Iceberg Made Simple
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-sm hover:bg-muted/80"
                  onClick={() =>
                    window.open("https://www.nimtable.com/docs", "_blank")
                  }
                >
                  Documentation
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-sm hover:bg-muted/80"
                  onClick={() =>
                    window.open("https://www.nimtable.com/support", "_blank")
                  }
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

export default Page
