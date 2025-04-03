"use client"

import Link from "next/link"
import { ArrowLeft, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SqlEditorNavbar() {
    return (
        <div className="border-b">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 border-muted-foreground/20" asChild>
                                    <Link href="/">
                                        <ArrowLeft className="h-4 w-4" />
                                        <span className="sr-only">Back to dashboard</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>Back to dashboard</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                            <FileCode className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="font-medium">SQL Workspace</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
