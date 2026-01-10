import { type DistributionData } from "@/lib/data-loader"

interface FileStatisticsProps {
  distribution: DistributionData
}

function FileTypeStats({
  fileCount,
  fileSize,
  recordCount,
  title,
}: {
  fileCount: number
  fileSize: number
  recordCount: number
  title: string
}) {
  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-normal text-card-foreground mb-4 text-center">
        {title}
      </h4>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <div className="text-2xl font-semibold text-card-foreground">
            {fileCount}
          </div>
          <div className="text-xs text-muted-foreground">Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-card-foreground">
            {(fileSize / (1024 * 1024)).toFixed(2)} MB
          </div>
          <div className="text-xs text-muted-foreground">Size</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-card-foreground">
            {recordCount.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Records</div>
        </div>
      </div>
    </div>
  )
}

export function FileStatistics({ distribution }: FileStatisticsProps) {
  return (
    <div className="flex gap-8 justify-around">
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
