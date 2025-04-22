import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function FileDistributionLoading() {
    return (
        <Card className="border-muted/70 shadow-sm h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">File Size Distribution</CardTitle>
                <CardDescription>Loading distribution data...</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Total Files: 0</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={true}
                        >
                            <RefreshCw className="h-3 w-3 animate-spin" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-5">
                    {["0-8M", "8M-32M", "32M-128M", "128M-512M", "512M+"].map((range) => (
                        <div key={range} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`h-3 w-3 rounded-full ${range === "0-8M"
                                            ? "bg-blue-300 dark:bg-blue-400/80"
                                            : range === "8M-32M"
                                                ? "bg-blue-400 dark:bg-blue-500/80"
                                                : range === "32M-128M"
                                                    ? "bg-blue-500"
                                                    : range === "128M-512M"
                                                        ? "bg-blue-600"
                                                        : "bg-blue-700"
                                            }`}
                                    />
                                    <span className="text-sm font-medium">{range}</span>
                                </div>
                                <div className="h-4 w-24 bg-muted/50 rounded animate-pulse"></div>
                            </div>
                            <div className="h-2.5 bg-muted/50 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-muted/70 rounded-full w-1/6 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-muted/50">
                    <div className="space-y-6">
                        {["Data Files", "Position Delete Files", "Equality Delete Files"].map((title) => (
                            <div key={title} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{title}</span>
                                    <div className="h-4 w-24 bg-muted/50 rounded animate-pulse"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="h-4 w-16 bg-muted/50 rounded animate-pulse"></div>
                                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse"></div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-4 w-16 bg-muted/50 rounded animate-pulse"></div>
                                        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-muted/50">
                    <div className="text-sm">
                        <p className="mb-2 font-medium text-foreground">Optimization Recommendation:</p>
                        <div className="h-4 w-48 bg-muted/50 rounded animate-pulse"></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 