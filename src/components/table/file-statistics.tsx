import { type DistributionData } from "@/lib/data-loader"

interface FileStatisticsProps {
    distribution: DistributionData;
}

interface StatCardProps {
    value: string | number;
    label: string;
    className?: string;
}

function StatCard({ value, label, className = "" }: StatCardProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 ${className}`}>
            <span className="text-lg font-semibold">{value}</span>
            <span className="text-xs text-muted-foreground mt-1">{label}</span>
        </div>
    )
}

function FileTypeStats({ 
    fileCount, 
    fileSize, 
    recordCount, 
    title 
}: { 
    fileCount: number; 
    fileSize: number; 
    recordCount: number; 
    title: string;
}) {
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium mb-3">{title}</h3>
            <div className="grid grid-cols-3 gap-3">
                <StatCard 
                    value={fileCount} 
                    label="Files"
                />
                <StatCard 
                    value={`${(fileSize / (1024 * 1024)).toFixed(2)} MB`}
                    label="Size"
                />
                <StatCard 
                    value={recordCount.toLocaleString()}
                    label="Records"
                />
            </div>
        </div>
    )
}

export function FileStatistics({ distribution }: FileStatisticsProps) {
    return (
        <div className="space-y-6">
            <FileTypeStats
                title="Data Files"
                fileCount={distribution.dataFileCount}
                fileSize={distribution.dataFileSizeInBytes}
                recordCount={distribution.dataFileRecordCount}
            />
            <FileTypeStats
                title="Position Delete Files"
                fileCount={distribution.positionDeleteFileCount}
                fileSize={distribution.positionDeleteFileSizeInBytes}
                recordCount={distribution.positionDeleteFileRecordCount}
            />
            <FileTypeStats
                title="Equality Delete Files"
                fileCount={distribution.eqDeleteFileCount}
                fileSize={distribution.eqDeleteFileSizeInBytes}
                recordCount={distribution.eqDeleteFileRecordCount}
            />
        </div>
    )
} 