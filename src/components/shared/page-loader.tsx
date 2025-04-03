import type { LucideIcon } from "lucide-react"

interface PageLoaderProps {
    icon: LucideIcon
    title: string
    entity?: string
    entityType?: string
}

export function PageLoader({ icon: Icon, title, entity, entityType }: PageLoaderProps) {
    return (
        <div className="flex items-center justify-center min-h-screen p-6">
            <div className="flex flex-col items-center gap-5 text-center max-w-xs bg-background/60 backdrop-blur-sm p-8 rounded-xl border shadow-sm">
                <div className="relative">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-blue-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-blue-500" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-base font-medium">{title}</h3>
                    {entity && (
                        <p className="text-sm text-muted-foreground">
                            {entityType && `${entityType}: `}
                            <span className="font-medium text-blue-500">{entity}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
