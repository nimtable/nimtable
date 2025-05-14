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

import Image from "next/image"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SidebarInset } from "@/components/ui/sidebar"
import {
  ArrowRight,
  BarChart3,
  Database,
  ExternalLink,
  Gauge,
  Layers,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SidebarInset } from "@/components/ui/sidebar"
import {
  ArrowRight,
  BarChart3,
  Database,
  ExternalLink,
  Gauge,
  Layers,
  Plus,
} from "lucide-react"

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

const Page = () => {
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
                <Image
                  src="/horizontal-light.svg"
                  alt="Nimtable Logo"
                  width={160}
                  height={40}
                  className="h-20 w-auto inline-block -ml-2"
                />
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                <span className="font-medium text-foreground">
                  Managed Iceberg Made Simple
                </span>{" "}
                — Explore and manage your Apache Iceberg tables with an
                intuitive, powerful interface.
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
                    <CardTitle className="text-xl">
                      Connect to your Iceberg catalogs
                    </CardTitle>
                    <CardDescription className="text-base">
                      Set up a connection to your Iceberg catalog to start
                      managing your data lake
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 mt-2 md:grid-cols-3">
                      <div className="flex flex-col gap-3 p-4 rounded-lg border border-muted bg-muted/30 transition-colors hover:bg-muted/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-lg">
                          1
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-medium">
                            Create a catalog connection
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Configure a connection to your REST, JDBC, S3
                            Tables, or AWS Glue catalog
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 p-4 rounded-lg border border-muted bg-muted/30 transition-colors hover:bg-muted/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-lg">
                          2
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-medium">Browse namespaces</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Navigate through your catalog&apos;s namespaces to
                            access your Iceberg tables
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 p-4 rounded-lg border border-muted bg-muted/30 transition-colors hover:bg-muted/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-lg">
                          3
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-medium">Manage your tables</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            View schema, query data, and optimize your Iceberg
                            tables with built-in tools
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pb-6 flex flex-col items-center">
                    <div className="max-w-lg w-full flex flex-col items-center">
                      {/* Action buttons container */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                        {/* Primary action - Create Catalog Connection */}
                        <div className="relative w-auto max-w-xs p-1 rounded-xl bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600">
                          <Button
                            className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] w-auto px-6 h-12 rounded-lg"
                            onClick={() =>
                              (window.location.href = "/catalog/new")
                            }
                          >
                            {/* Animated shine effect */}
                            <div className="absolute top-0 -left-[100%] w-[120%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out"></div>

                            {/* Button content with animated icon */}
                            <div className="relative flex items-center justify-center gap-3">
                              <div className="bg-white/20 rounded-full p-1.5">
                                <Plus className="h-5 w-5" />
                              </div>
                              <span className="font-semibold text-base tracking-wide">
                                Create Catalog Connection
                              </span>
                            </div>
                          </Button>
                        </div>

                        {/* Secondary action - Learn more link */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 h-8 gap-1.5"
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
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <h2 className="text-xl font-semibold">Features</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Feature 1: Simplify Iceberg Operations */}
                  <Card className="bg-background shadow-md border-muted/60 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                    <CardHeader>
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg w-fit mb-3">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">
                        Simplify Iceberg Operations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Streamline Apache Iceberg management with intuitive
                        dashboards and real-time monitoring. Reduce complexity
                        and save time.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Feature 2: Visual Catalog Explorer */}
                  <Card className="bg-background shadow-md border-muted/60 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                    <CardHeader>
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg w-fit mb-3">
                        <Layers className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">
                        Visual Catalog Explorer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Visually navigate your data lake&apos;s metadata and
                        schema. Gain instant insights into your Iceberg tables
                        without writing queries.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Feature 3: Compaction-as-a-Service */}
                  <Card className="bg-background shadow-md border-muted/60 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"></div>
                    <CardHeader>
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg w-fit mb-3">
                        <Gauge className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">
                        Compaction-as-a-Service
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
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
                      <h3 className="font-medium mb-1.5">
                        Multiple catalog types supported
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
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
          <footer className="border-t bg-background py-5 px-8">
            <div className="mx-auto max-w-5xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/horizontal-light.svg"
                  alt="Nimtable Logo"
                  width={120}
                  height={24}
                  className="h-10 w-auto -mr-5 -mt-[2px]"
                />
                <p className="text-sm text-muted-foreground">
                  v1.0 — Managed Iceberg Made Simple
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm gap-1.5 h-8 hover:bg-muted/80"
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
                  className="text-sm gap-1.5 h-8 hover:bg-muted/80"
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
