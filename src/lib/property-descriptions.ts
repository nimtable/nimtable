/*
 * Copyright 2026 Nimtable
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

/**
 * Descriptions for Iceberg table properties
 * This file contains descriptions for various Iceberg table properties
 * to be displayed in tooltips in the UI
 */

export const propertyDescriptions: Record<string, string> = {
  // Commit properties
  "commit.retry.num-retries":
    "Number of times to retry a commit before failing",
  "commit.retry.min-wait-ms":
    "Minimum time in milliseconds to wait before retrying a commit",
  "commit.retry.max-wait-ms":
    "Maximum time in milliseconds to wait before retrying a commit",
  "commit.retry.total-timeout-ms":
    "Total retry timeout period in milliseconds for a commit",
  "commit.status-check.num-retries":
    "Number of times to check whether a commit succeeded after a connection is lost before failing due to an unknown commit state",
  "commit.status-check.min-wait-ms":
    "Minimum time in milliseconds to wait before retrying a status-check",
  "commit.status-check.max-wait-ms":
    "Maximum time in milliseconds to wait before retrying a status-check",
  "commit.status-check.total-timeout-ms":
    "Total timeout period in which the commit status-check must succeed, in milliseconds",
  "commit.manifest.target-size-bytes":
    "Target size when merging manifest files",
  "commit.manifest.min-count-to-merge":
    "Minimum number of manifests to accumulate before merging",
  "commit.manifest-merge.enabled":
    "Controls whether to automatically merge manifests on writes",

  // History properties
  "history.expire.max-snapshot-age-ms":
    "Default max age of snapshots to keep on the table and all of its branches while expiring snapshots",
  "history.expire.min-snapshots-to-keep":
    "Default min number of snapshots to keep on the table and all of its branches while expiring snapshots",
  "history.expire.max-ref-age-ms":
    "For snapshot references except the main branch, default max age of snapshot references to keep while expiring snapshots. The main branch never expires",

  // Write properties
  "write.format.default":
    "Default file format for the table; parquet, avro, or orc",
  "write.delete.format.default":
    "Default delete file format for the table; parquet, avro, or orc",
  "write.parquet.row-group-size-bytes": "Parquet row group size",
  "write.parquet.page-size-bytes": "Parquet page size",
  "write.parquet.page-row-limit": "Parquet page row limit",
  "write.parquet.dict-size-bytes": "Parquet dictionary page size",
  "write.parquet.compression-codec":
    "Parquet compression codec: zstd, brotli, lz4, gzip, snappy, uncompressed",
  "write.parquet.compression-level": "Parquet compression level",
  "write.parquet.bloom-filter-enabled.column":
    "Hint to parquet to write a bloom filter for the column",
  "write.parquet.bloom-filter-max-bytes":
    "The maximum number of bytes for a bloom filter bitset",
  "write.parquet.bloom-filter-fpp.column":
    "The false positive probability for a bloom filter (must > 0.0 and < 1.0)",
  "write.avro.compression-codec":
    "Avro compression codec: gzip(deflate with 9 level), zstd, snappy, uncompressed",
  "write.avro.compression-level": "Avro compression level",
  "write.orc.stripe-size-bytes": "Define the default ORC stripe size, in bytes",
  "write.orc.block-size-bytes":
    "Define the default file system block size for ORC files",
  "write.orc.compression-codec":
    "ORC compression codec: zstd, lz4, lzo, zlib, snappy, none",
  "write.orc.compression-strategy":
    "ORC compression strategy: speed, compression",
  "write.orc.bloom.filter.columns":
    "Comma separated list of column names for which a Bloom filter must be created",
  "write.orc.bloom.filter.fpp":
    "False positive probability for Bloom filter (must > 0.0 and < 1.0)",
  "write.location-provider.impl":
    "Optional custom implementation for LocationProvider",
  "write.metadata.compression-codec":
    "Metadata compression codec; none or gzip",
  "write.metadata.metrics.max-inferred-column-defaults":
    "Defines the maximum number of top level columns for which metrics are collected",
  "write.metadata.metrics.default":
    "Default metrics mode for all columns in the table; none, counts, truncate(length), or full",
  "write.metadata.metrics.column":
    "Metrics mode for column to allow per-column tuning; none, counts, truncate(length), or full",
  "write.target-file-size-bytes":
    "Controls the size of files generated to target about this many bytes",
  "write.delete.target-file-size-bytes":
    "Controls the size of delete files generated to target about this many bytes",
  "write.distribution-mode":
    "Defines distribution of write data: none, hash, or range",
  "write.delete.distribution-mode": "Defines distribution of write delete data",
  "write.update.distribution-mode": "Defines distribution of write update data",
  "write.merge.distribution-mode": "Defines distribution of write merge data",
  "write.wap.enabled": "Enables write-audit-publish writes",
  "write.summary.partition-limit":
    "Includes partition-level summary stats in snapshot summaries if the changed partition count is less than this limit",
  "write.metadata.delete-after-commit.enabled":
    "Controls whether to delete the oldest tracked version metadata files after commit",
  "write.metadata.previous-versions-max":
    "The max number of previous version metadata files to keep before deleting after commit",
  "write.spark.fanout.enabled":
    "Enables the fanout writer in Spark that does not require data to be clustered; uses more memory",
  "write.object-storage.enabled":
    "Enables the object storage location provider that adds a hash component to file paths",
  "write.object-storage.partitioned-paths":
    "Includes the partition values in the file path",
  "write.data.path": "Base location for data files",
  "write.metadata.path": "Base location for metadata files",
  "write.delete.mode":
    "Mode used for delete commands: copy-on-write or merge-on-read (v2 only)",
  "write.delete.isolation-level":
    "Isolation level for delete commands: serializable or snapshot",
  "write.update.mode":
    "Mode used for update commands: copy-on-write or merge-on-read (v2 only)",
  "write.update.isolation-level":
    "Isolation level for update commands: serializable or snapshot",
  "write.merge.mode":
    "Mode used for merge commands: copy-on-write or merge-on-read (v2 only)",
  "write.merge.isolation-level":
    "Isolation level for merge commands: serializable or snapshot",

  // Read properties
  "read.split.target-size": "Target size when combining data input splits",
  "read.split.metadata-target-size":
    "Target size when combining metadata input splits",
  "read.split.planning-lookback":
    "Number of bins to consider when combining input splits",
  "read.split.open-file-cost":
    "The estimated cost to open a file, used as a minimum weight when combining splits",
  "read.parquet.vectorization.enabled":
    "Controls whether Parquet vectorized reads are used",
  "read.parquet.vectorization.batch-size":
    "The batch size for parquet vectorized reads",
  "read.orc.vectorization.enabled":
    "Controls whether orc vectorized reads are used",
  "read.orc.vectorization.batch-size":
    "The batch size for orc vectorized reads",
}

/**
 * Helper function to get the description for a property
 * Tries exact match first, then partial match
 */
export const getPropertyDescription = (key: string): string | undefined => {
  // Try exact match first
  if (propertyDescriptions[key]) {
    return propertyDescriptions[key]
  }

  // Try partial match for properties not in our mapping
  for (const propKey in propertyDescriptions) {
    if (key.includes(propKey)) {
      return propertyDescriptions[propKey]
    }
  }

  return undefined
}
