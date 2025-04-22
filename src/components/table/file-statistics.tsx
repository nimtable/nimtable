import { type DistributionData } from "@/lib/data-loader"

interface FileStatisticsProps {
    distribution: DistributionData;
}

export function FileStatistics({ distribution }: FileStatisticsProps) {
    return (
        <div className="text-sm">
            <p className="mb-2 font-medium text-foreground">File Statistics:</p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-muted-foreground">Data Files: {distribution.dataFileCount}</p>
                    <p className="text-muted-foreground">Position Delete Files: {distribution.positionDeleteFileCount}</p>
                    <p className="text-muted-foreground">Equality Delete Files: {distribution.eqDeleteFileCount}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Data Size: {(distribution.dataFileSizeInBytes / (1024 * 1024)).toFixed(2)} MB</p>
                    <p className="text-muted-foreground">Position Delete Size: {(distribution.positionDeleteFileSizeInBytes / (1024 * 1024)).toFixed(2)} MB</p>
                    <p className="text-muted-foreground">Equality Delete Size: {(distribution.eqDeleteFileSizeInBytes / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                    <p className="font-medium text-foreground mb-2">Record Counts:</p>
                    <p className="text-muted-foreground">Data Records: {distribution.dataFileRecordCount.toLocaleString()}</p>
                    <p className="text-muted-foreground">Position Delete Records: {distribution.positionDeleteFileRecordCount.toLocaleString()}</p>
                    <p className="text-muted-foreground">Equality Delete Records: {distribution.eqDeleteFileRecordCount.toLocaleString()}</p>
                </div>
            </div>
        </div>
    )
} 