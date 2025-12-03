import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Info } from "lucide-react"
import { FileStatistics } from "@/components/table/file-statistics"
import type { DistributionData } from "@/lib/data-loader"

// Define the order of size ranges
export const rangeOrder = ["0-8M", "8M-32M", "32M-128M", "128M-512M", "512M+"]

// Minimum file count threshold for optimization recommendations
const MIN_FILES_FOR_OPTIMIZATION = 16

// Shared optimization recommendation logic
export const getOptimizationRecommendation = (
  distribution: DistributionData
) => {
  const ranges = distribution.ranges
  const totalFiles = Object.values(ranges).reduce(
    (sum, item) => sum + item.count,
    0
  )

  // Check if there are enough files to warrant optimization
  if (totalFiles < MIN_FILES_FOR_OPTIMIZATION) {
    return {
      shouldOptimize: false,
      recommendations: [
        `Total file count (${totalFiles}) is too low to warrant optimization. At least ${MIN_FILES_FOR_OPTIMIZATION} files are recommended.`,
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
    shouldOptimize: recommendations.length > 0,
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

  // Get optimization recommendation
  const { shouldOptimize, recommendations } =
    getOptimizationRecommendation(distribution)

  return (
    <Card className="h-full border-muted/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-card-foreground">
              File Size Distribution
            </h3>
            <div className="relative group">
              <Info className="w-4 h-4 text-muted-foreground hover:text-card-foreground cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
                Current distribution of file sizes in the table
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {shouldOptimize ? (
              <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-1 dark:border-yellow-900/50 dark:bg-yellow-950/30">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Needs Optimization
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-success"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z" />
                </svg>
                <span className="text-success font-normal">Healthy</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6 grid grid-cols-[5fr_5fr] gap-8 mt-6">
          {/* File Statistics section */}
          <div className="border border-border rounded-lg p-6 bg-muted/20">
            <FileStatistics distribution={distribution} />
          </div>

          {/* Distribution Chart, Total Files and Recommendation section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-normal text-card-foreground">
                Total Files: {totalFiles}
              </span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isFetching}
                  className="text-muted-foreground hover:text-card-foreground"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
                  />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {sortedDistributionEntries.map(([range, data]) => (
                <div key={range}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          data.count > 0 ? "bg-primary" : "bg-muted"
                        }`}
                      />
                      <span className="text-card-foreground">{range}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {data.count} files ({data.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    {data.count > 0 && (
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${data.percentage}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showRecommendation && (
              <div className="mt-6 p-3 bg-muted rounded">
                <p className="text-sm font-normal text-card-foreground mb-1">
                  Optimization Recommendation:
                </p>
                {shouldOptimize ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      This table would benefit from optimization for the
                      following reasons:
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {recommendations.map((reason: string, index: number) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This table's file distribution is optimal and does not
                    require optimization at this time.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
