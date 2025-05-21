import { AlertTriangle, RefreshCw, CheckCircle2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { FileStatistics } from "@/components/table/file-statistics"
import type { DistributionData } from "@/lib/data-loader"

// Define the order of size ranges
export const rangeOrder = ["0-8M", "8M-32M", "32M-128M", "128M-512M", "512M+"]

// Shared compaction recommendation logic
export const getCompactionRecommendation = (distribution: DistributionData) => {
  const ranges = distribution.ranges
  const totalFiles = Object.values(ranges).reduce(
    (sum, item) => sum + item.count,
    0
  )

  // Check if there are enough files to warrant compaction
  if (totalFiles < 10) {
    return {
      shouldCompact: false,
      recommendations: [
        `Total file count (${totalFiles}) is too low to warrant compaction. At least 10 files are recommended.`,
      ],
    }
  }

  // 1. Check small files
  const smallFilesCount =
    (ranges["0-8M"]?.count || 0) + (ranges["8M-32M"]?.count || 0)
  const smallFilesPercentage = (smallFilesCount / totalFiles) * 100

  // 2. Check total files
  const tooManyFiles = totalFiles > 1000

  // 3. Check file size distribution
  const fileSizes = Object.entries(ranges).flatMap(([range, data]) => {
    const [min, max] = range.split("-").map((size) => {
      if (size.endsWith("M")) {
        return parseInt(size) * 1024 * 1024
      }
      return parseInt(size)
    })
    const avgSize = (min + max) / 2
    return Array(data.count).fill(avgSize)
  })

  const mean = fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length
  const variance =
    fileSizes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / fileSizes.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = stdDev / mean
  const unevenDistribution = coefficientOfVariation > 0.5

  // 4. Check medium files
  const mediumFilesCount = ranges["32M-128M"]?.count || 0
  const mediumFilesPercentage = (mediumFilesCount / totalFiles) * 100
  const tooManyMediumFiles = mediumFilesPercentage > 40

  const recommendations = []

  if (smallFilesPercentage > 30) {
    recommendations.push(
      `Small files (0-32M) account for ${smallFilesPercentage.toFixed(1)}% of total files`
    )
  }
  if (tooManyFiles) {
    recommendations.push(`Total file count (${totalFiles}) exceeds 1000 files`)
  }
  if (unevenDistribution) {
    recommendations.push(
      `File size distribution is uneven (coefficient of variation: ${coefficientOfVariation.toFixed(2)})`
    )
  }
  if (tooManyMediumFiles) {
    recommendations.push(
      `Medium-sized files (32M-128M) account for ${mediumFilesPercentage.toFixed(1)}% of total files`
    )
  }

  return {
    shouldCompact: recommendations.length > 0,
    recommendations,
  }
}

interface FileDistributionProps {
  distribution: DistributionData
  isFetching: boolean
  onRefresh?: () => void
  showRecommendation?: boolean
}

export function FileDistribution({
  distribution,
  isFetching,
  onRefresh,
  showRecommendation = true,
}: FileDistributionProps) {
  // Sort the distribution data according to our predefined size order
  const sortedDistributionEntries = Object.entries(distribution.ranges).sort(
    (a, b) => {
      const indexA = rangeOrder.indexOf(a[0])
      const indexB = rangeOrder.indexOf(b[0])
      return indexA - indexB
    }
  )

  // Calculate total files
  const totalFiles = Object.values(distribution.ranges).reduce(
    (sum, item) => sum + item.count,
    0
  )

  // Get compaction recommendation
  const { shouldCompact, recommendations } =
    getCompactionRecommendation(distribution)

  return (
    <Card className="border-muted/70 shadow-sm h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">File Size Distribution</CardTitle>
            <CardDescription>
              Current distribution of file sizes in the table
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {shouldCompact ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 dark:bg-yellow-950/30 rounded-md border border-yellow-200 dark:border-yellow-900/50">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Needs Compaction
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-900/50">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Health
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left section - File Statistics */}
          <div className="space-y-6">
            <div className="pt-4">
              <FileStatistics distribution={distribution} />
            </div>
          </div>

          {/* Right section - Distribution Chart, Total Files and Recommendation */}
          <div className="space-y-6">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Total Files: {totalFiles}</span>
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onRefresh}
                    disabled={isFetching}
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
                    />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-5">
              {sortedDistributionEntries.map(([range, data]) => (
                <div key={range} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          range === "0-8M"
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
                    <span className="text-sm text-muted-foreground">
                      {data.count} files ({data.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted/50 rounded-full w-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        range === "0-8M"
                          ? "bg-blue-300 dark:bg-blue-400/80"
                          : range === "8M-32M"
                            ? "bg-blue-400 dark:bg-blue-500/80"
                            : range === "32M-128M"
                              ? "bg-blue-500"
                              : range === "128M-512M"
                                ? "bg-blue-600"
                                : "bg-blue-700"
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {showRecommendation && (
              <div className="pt-4 border-t border-muted/50">
                <div className="text-sm">
                  <p className="mb-2 font-medium text-foreground">
                    Optimization Recommendation:
                  </p>
                  {shouldCompact ? (
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        This table would benefit from compaction for the
                        following reasons:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {recommendations.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      This table's file distribution is optimal and does not
                      require compaction at this time.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
