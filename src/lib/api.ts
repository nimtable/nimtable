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

/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 * NOTE(eric):
 * As stated above, this file was generated via swagger-typescript-api by:
 *   npx swagger-typescript-api -p https://raw.githubusercontent.com/apache/iceberg/refs/heads/main/open-api/rest-catalog-open-api.yaml -o ./src/lib -n api.ts --unwrap-response-data
 *
 * If you make any changes to this file manually, please also note down here.
 * - Added `format: "json"` to all requests to ensure the response is parsed.
 * - Modified `request()` to throw `r.error` instead of `data` if the response is not ok.
 * - Modified `response.json()` to parse `snapshot-id` as strings because it may be greater than MAX_SAFE_INTEGER
 */
type UtilRequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/** JSON error payload returned in a response with further details on the error */
export interface ErrorModel {
  /** Human-readable error message */
  message: string
  /**
   * Internal type definition of the error
   * @example "NoSuchNamespaceException"
   */
  type: string
  /**
   * HTTP response code
   * @min 400
   * @max 600
   * @example 404
   */
  code: number
  stack?: string[]
}

/** Server-provided configuration for the catalog. */
export interface CatalogConfig {
  /** Properties that should be used to override client configuration; applied after defaults and client configuration. */
  overrides: Record<string, string>
  /** Properties that should be used as default configuration; applied before client configuration. */
  defaults: Record<string, string>
  /**
   * A list of endpoints that the server supports. The format of each endpoint must be "<HTTP verb> <resource path from OpenAPI REST spec>". The HTTP verb and the resource path must be separated by a space character.
   * @example ["GET /v1/{prefix}/namespaces/{namespace}","GET /v1/{prefix}/namespaces","POST /v1/{prefix}/namespaces","GET /v1/{prefix}/namespaces/{namespace}/tables/{table}","GET /v1/{prefix}/namespaces/{namespace}/views/{view}"]
   */
  endpoints?: string[]
}

export interface CreateNamespaceRequest {
  /** Reference to one or more levels of a namespace */
  namespace: Namespace
  /**
   * Configured string to string map of properties for the namespace
   * @default {}
   * @example {"owner":"Hank Bendickson"}
   */
  properties?: Record<string, string>
}

export interface UpdateNamespacePropertiesRequest {
  /**
   * @uniqueItems true
   * @example ["department","access_group"]
   */
  removals?: string[]
  /** @example {"owner":"Hank Bendickson"} */
  updates?: Record<string, string>
}

export interface RenameTableRequest {
  source: TableIdentifier
  destination: TableIdentifier
}

/**
 * Reference to one or more levels of a namespace
 * @example ["accounting","tax"]
 */
export type Namespace = string[]

/**
 * An opaque token that allows clients to make use of pagination for list APIs (e.g. ListTables). Clients may initiate the first paginated request by sending an empty query parameter `pageToken` to the server.
 * Servers that support pagination should identify the `pageToken` parameter and return a `next-page-token` in the response if there are more results available.  After the initial request, the value of `next-page-token` from each response must be used as the `pageToken` parameter value for the next request. The server must return `null` value for the `next-page-token` in the last response.
 * Servers that support pagination must return all results in a single response with the value of `next-page-token` set to `null` if the query parameter `pageToken` is not set in the request.
 * Servers that do not support pagination should ignore the `pageToken` parameter and return all results in a single response. The `next-page-token` must be omitted from the response.
 * Clients must interpret either `null` or missing response value of `next-page-token` as the end of the listing results.
 */
export type PageToken = string | null

export interface TableIdentifier {
  /** Reference to one or more levels of a namespace */
  namespace: Namespace
  name: string
}

/** @example ["long","string","fixed[16]","decimal(10,2)"] */
export type PrimitiveType = string

export interface StructField {
  id: number
  name: string
  type: Type
  required: boolean
  doc?: string
  "initial-default"?: PrimitiveTypeValue
  "write-default"?: PrimitiveTypeValue
}

export interface StructType {
  type: "struct"
  fields: StructField[]
}

export interface ListType {
  type: "list"
  "element-id": number
  element: Type
  "element-required": boolean
}

export interface MapType {
  type: "map"
  "key-id": number
  key: Type
  "value-id": number
  value: Type
  "value-required": boolean
}

export type Type = PrimitiveType | StructType | ListType | MapType

export type Schema = StructType & {
  "schema-id"?: number
  "identifier-field-ids"?: number[]
}

export type Expression =
  | TrueExpression
  | FalseExpression
  | AndOrExpression
  | NotExpression
  | SetExpression
  | LiteralExpression
  | UnaryExpression

/** @example ["true","false","eq","and","or","not","in","not-in","lt","lt-eq","gt","gt-eq","not-eq","starts-with","not-starts-with","is-null","not-null","is-nan","not-nan"] */
export type ExpressionType = string

export interface TrueExpression {
  type: ExpressionType
}

export interface FalseExpression {
  type: ExpressionType
}

export interface AndOrExpression {
  type: ExpressionType
  left: Expression
  right: Expression
}

export interface NotExpression {
  type: ExpressionType
  child: Expression
}

export interface UnaryExpression {
  type: ExpressionType
  term: Term
  value: object
}

export interface LiteralExpression {
  type: ExpressionType
  term: Term
  value: object
}

export interface SetExpression {
  type: ExpressionType
  term: Term
  values: object[]
}

export type Term = Reference | TransformTerm

/** @example ["column-name"] */
export type Reference = string

export interface TransformTerm {
  type: "transform"
  transform: Transform
  term: Reference
}

/** @example ["identity","year","month","day","hour","bucket[256]","truncate[16]"] */
export type Transform = string

export interface PartitionField {
  "field-id"?: number
  "source-id": number
  name: string
  transform: Transform
}

export interface PartitionSpec {
  "spec-id"?: number
  fields: PartitionField[]
}

export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
}

export enum NullOrder {
  NullsFirst = "nulls-first",
  NullsLast = "nulls-last",
}

export interface SortField {
  "source-id": number
  transform: Transform
  direction: SortDirection
  "null-order": NullOrder
}

export interface SortOrder {
  "order-id": number
  fields: SortField[]
}

export interface Snapshot {
  /** @format int64 */
  "snapshot-id": string
  /** @format int64 */
  "parent-snapshot-id"?: string
  /** @format int64 */
  "sequence-number"?: number
  /** @format int64 */
  "timestamp-ms": number
  /** Location of the snapshot's manifest list file */
  "manifest-list": string
  summary: {
    operation: "append" | "replace" | "overwrite" | "delete"
    [key: string]: any
  }
  "schema-id"?: number
}

export interface SnapshotReference {
  type: "tag" | "branch"
  /** @format int64 */
  "snapshot-id": string
  /** @format int64 */
  "max-ref-age-ms"?: number
  /** @format int64 */
  "max-snapshot-age-ms"?: number
  "min-snapshots-to-keep"?: number
}

export type SnapshotReferences = Record<string, SnapshotReference>

export type SnapshotLog = {
  /** @format int64 */
  "snapshot-id": string
  /** @format int64 */
  "timestamp-ms": number
}[]

export type MetadataLog = {
  "metadata-file": string
  /** @format int64 */
  "timestamp-ms": number
}[]

export interface TableMetadata {
  /**
   * @min 1
   * @max 2
   */
  "format-version": number
  "table-uuid": string
  location?: string
  /** @format int64 */
  "last-updated-ms"?: number
  properties?: Record<string, string>
  schemas?: Schema[]
  "current-schema-id"?: number
  "last-column-id"?: number
  "partition-specs"?: PartitionSpec[]
  "default-spec-id"?: number
  "last-partition-id"?: number
  "sort-orders"?: SortOrder[]
  "default-sort-order-id"?: number
  snapshots?: Snapshot[]
  refs?: SnapshotReferences
  /** @format int64 */
  "current-snapshot-id"?: string
  /** @format int64 */
  "last-sequence-number"?: number
  "snapshot-log"?: SnapshotLog
  "metadata-log"?: MetadataLog
  statistics?: StatisticsFile[]
  "partition-statistics"?: PartitionStatisticsFile[]
}

export interface SQLViewRepresentation {
  type: string
  sql: string
  dialect: string
}

export type ViewRepresentation = SQLViewRepresentation

export interface ViewHistoryEntry {
  "version-id": number
  /** @format int64 */
  "timestamp-ms": number
}

export interface ViewVersion {
  "version-id": number
  /** @format int64 */
  "timestamp-ms": number
  /** Schema ID to set as current, or -1 to set last added schema */
  "schema-id": number
  summary: Record<string, string>
  representations: ViewRepresentation[]
  "default-catalog"?: string
  /** Reference to one or more levels of a namespace */
  "default-namespace": Namespace
}

export interface ViewMetadata {
  "view-uuid": string
  /**
   * @min 1
   * @max 1
   */
  "format-version": number
  location: string
  "current-version-id": number
  versions: ViewVersion[]
  "version-log": ViewHistoryEntry[]
  schemas: Schema[]
  properties?: Record<string, string>
}

export type BaseUpdate = BaseBaseUpdate &
  (
    | BaseBaseUpdateActionMapping<"assign-uuid", AssignUUIDUpdate>
    | BaseBaseUpdateActionMapping<
        "upgrade-format-version",
        UpgradeFormatVersionUpdate
      >
    | BaseBaseUpdateActionMapping<"add-schema", AddSchemaUpdate>
    | BaseBaseUpdateActionMapping<"set-current-schema", SetCurrentSchemaUpdate>
    | BaseBaseUpdateActionMapping<"add-spec", AddPartitionSpecUpdate>
    | BaseBaseUpdateActionMapping<"set-default-spec", SetDefaultSpecUpdate>
    | BaseBaseUpdateActionMapping<"add-sort-order", AddSortOrderUpdate>
    | BaseBaseUpdateActionMapping<
        "set-default-sort-order",
        SetDefaultSortOrderUpdate
      >
    | BaseBaseUpdateActionMapping<"add-snapshot", AddSnapshotUpdate>
    | BaseBaseUpdateActionMapping<"set-snapshot-ref", SetSnapshotRefUpdate>
    | BaseBaseUpdateActionMapping<"remove-snapshots", RemoveSnapshotsUpdate>
    | BaseBaseUpdateActionMapping<
        "remove-snapshot-ref",
        RemoveSnapshotRefUpdate
      >
    | BaseBaseUpdateActionMapping<"set-location", SetLocationUpdate>
    | BaseBaseUpdateActionMapping<"set-properties", SetPropertiesUpdate>
    | BaseBaseUpdateActionMapping<"remove-properties", RemovePropertiesUpdate>
    | BaseBaseUpdateActionMapping<"add-view-version", AddViewVersionUpdate>
    | BaseBaseUpdateActionMapping<
        "set-current-view-version",
        SetCurrentViewVersionUpdate
      >
    | BaseBaseUpdateActionMapping<"set-statistics", SetStatisticsUpdate>
    | BaseBaseUpdateActionMapping<"remove-statistics", RemoveStatisticsUpdate>
    | BaseBaseUpdateActionMapping<
        "set-partition-statistics",
        SetPartitionStatisticsUpdate
      >
    | BaseBaseUpdateActionMapping<
        "remove-partition-statistics",
        RemovePartitionStatisticsUpdate
      >
    | BaseBaseUpdateActionMapping<
        "remove-partition-specs",
        RemovePartitionSpecsUpdate
      >
    | BaseBaseUpdateActionMapping<"remove-schemas", RemoveSchemasUpdate>
    | BaseBaseUpdateActionMapping<"enable-row-lineage", EnableRowLineageUpdate>
  )

/** Assigning a UUID to a table/view should only be done when creating the table/view. It is not safe to re-assign the UUID if a table/view already has a UUID assigned */
export type AssignUUIDUpdate = BaseBaseUpdate & {
  action?: "assign-uuid"
  uuid: string
}

export type UpgradeFormatVersionUpdate = BaseBaseUpdate & {
  action?: "upgrade-format-version"
  "format-version": number
}

export type AddSchemaUpdate = BaseBaseUpdate & {
  action?: "add-schema"
  schema: Schema
  /**
   * This optional field is **DEPRECATED for REMOVAL** since it more safe to handle this internally, and shouldn't be exposed to the clients.
   * The highest assigned column ID for the table. This is used to ensure columns are always assigned an unused ID when evolving schemas. When omitted, it will be computed on the server side.
   * @deprecated
   */
  "last-column-id"?: number
}

export type SetCurrentSchemaUpdate = BaseBaseUpdate & {
  action?: "set-current-schema"
  /** Schema ID to set as current, or -1 to set last added schema */
  "schema-id": number
}

export type AddPartitionSpecUpdate = BaseBaseUpdate & {
  action?: "add-spec"
  spec: PartitionSpec
}

export type SetDefaultSpecUpdate = BaseBaseUpdate & {
  action?: "set-default-spec"
  /** Partition spec ID to set as the default, or -1 to set last added spec */
  "spec-id": number
}

export type AddSortOrderUpdate = BaseBaseUpdate & {
  action?: "add-sort-order"
  "sort-order": SortOrder
}

export type SetDefaultSortOrderUpdate = BaseBaseUpdate & {
  action?: "set-default-sort-order"
  /** Sort order ID to set as the default, or -1 to set last added sort order */
  "sort-order-id": number
}

export type AddSnapshotUpdate = BaseBaseUpdate & {
  action?: "add-snapshot"
  snapshot: Snapshot
}

export type SetSnapshotRefUpdate = (BaseBaseUpdate & SnapshotReference) & {
  action?: "set-snapshot-ref"
  "ref-name": string
}

export type RemoveSnapshotsUpdate = BaseBaseUpdate & {
  action?: "remove-snapshots"
  "snapshot-ids": number[]
}

export type RemoveSnapshotRefUpdate = BaseBaseUpdate & {
  action?: "remove-snapshot-ref"
  "ref-name": string
}

export type SetLocationUpdate = BaseBaseUpdate & {
  action?: "set-location"
  location: string
}

export type SetPropertiesUpdate = BaseBaseUpdate & {
  action?: "set-properties"
  updates: Record<string, string>
}

export type RemovePropertiesUpdate = BaseBaseUpdate & {
  action?: "remove-properties"
  removals: string[]
}

export type AddViewVersionUpdate = BaseBaseUpdate & {
  action?: "add-view-version"
  "view-version": ViewVersion
}

export type SetCurrentViewVersionUpdate = BaseBaseUpdate & {
  action?: "set-current-view-version"
  /** The view version id to set as current, or -1 to set last added view version id */
  "view-version-id": number
}

export type SetStatisticsUpdate = BaseBaseUpdate & {
  action?: "set-statistics"
  /**
   * This optional field is **DEPRECATED for REMOVAL** since it contains redundant information. Clients should use the `statistics.snapshot-id` field instead.
   * @deprecated
   * @format int64
   */
  "snapshot-id"?: string
  statistics: StatisticsFile
}

export type RemoveStatisticsUpdate = BaseBaseUpdate & {
  action?: "remove-statistics"
  /** @format int64 */
  "snapshot-id": string
}

export type SetPartitionStatisticsUpdate = BaseBaseUpdate & {
  action?: "set-partition-statistics"
  "partition-statistics": PartitionStatisticsFile
}

export type RemovePartitionStatisticsUpdate = BaseBaseUpdate & {
  action?: "remove-partition-statistics"
  /** @format int64 */
  "snapshot-id": string
}

export type RemovePartitionSpecsUpdate = BaseBaseUpdate & {
  action?: "remove-partition-specs"
  "spec-ids": number[]
}

export type RemoveSchemasUpdate = BaseBaseUpdate & {
  action?: "remove-schemas"
  "schema-ids": number[]
}

export type EnableRowLineageUpdate = BaseBaseUpdate & {
  action?: "enable-row-lineage"
}

export type TableUpdate =
  | AssignUUIDUpdate
  | UpgradeFormatVersionUpdate
  | AddSchemaUpdate
  | SetCurrentSchemaUpdate
  | AddPartitionSpecUpdate
  | SetDefaultSpecUpdate
  | AddSortOrderUpdate
  | SetDefaultSortOrderUpdate
  | AddSnapshotUpdate
  | SetSnapshotRefUpdate
  | RemoveSnapshotsUpdate
  | RemoveSnapshotRefUpdate
  | SetLocationUpdate
  | SetPropertiesUpdate
  | RemovePropertiesUpdate
  | SetStatisticsUpdate
  | RemoveStatisticsUpdate
  | RemovePartitionSpecsUpdate
  | RemoveSchemasUpdate
  | EnableRowLineageUpdate

export type ViewUpdate =
  | AssignUUIDUpdate
  | UpgradeFormatVersionUpdate
  | AddSchemaUpdate
  | SetLocationUpdate
  | SetPropertiesUpdate
  | RemovePropertiesUpdate
  | AddViewVersionUpdate
  | SetCurrentViewVersionUpdate

export type TableRequirement = BaseTableRequirement &
  (
    | BaseTableRequirementTypeMapping<"assert-create", AssertCreate>
    | BaseTableRequirementTypeMapping<"assert-table-uuid", AssertTableUUID>
    | BaseTableRequirementTypeMapping<
        "assert-ref-snapshot-id",
        AssertRefSnapshotId
      >
    | BaseTableRequirementTypeMapping<
        "assert-last-assigned-field-id",
        AssertLastAssignedFieldId
      >
    | BaseTableRequirementTypeMapping<
        "assert-current-schema-id",
        AssertCurrentSchemaId
      >
    | BaseTableRequirementTypeMapping<
        "assert-last-assigned-partition-id",
        AssertLastAssignedPartitionId
      >
    | BaseTableRequirementTypeMapping<
        "assert-default-spec-id",
        AssertDefaultSpecId
      >
    | BaseTableRequirementTypeMapping<
        "assert-default-sort-order-id",
        AssertDefaultSortOrderId
      >
  )

/** The table must not already exist; used for create transactions */
export type AssertCreate = UtilRequiredKeys<BaseTableRequirement, "type"> & {
  type: "assert-create"
}

/** The table UUID must match the requirement's `uuid` */
export type AssertTableUUID = UtilRequiredKeys<BaseTableRequirement, "type"> & {
  type: "assert-table-uuid"
  uuid: string
}

/** The table branch or tag identified by the requirement's `ref` must reference the requirement's `snapshot-id`; if `snapshot-id` is `null` or missing, the ref must not already exist */
export type AssertRefSnapshotId = BaseTableRequirement & {
  type?: "assert-ref-snapshot-id"
  ref: string
  /** @format int64 */
  "snapshot-id": string
}

/** The table's last assigned column id must match the requirement's `last-assigned-field-id` */
export type AssertLastAssignedFieldId = BaseTableRequirement & {
  type?: "assert-last-assigned-field-id"
  "last-assigned-field-id": number
}

/** The table's current schema id must match the requirement's `current-schema-id` */
export type AssertCurrentSchemaId = BaseTableRequirement & {
  type?: "assert-current-schema-id"
  "current-schema-id": number
}

/** The table's last assigned partition id must match the requirement's `last-assigned-partition-id` */
export type AssertLastAssignedPartitionId = BaseTableRequirement & {
  type?: "assert-last-assigned-partition-id"
  "last-assigned-partition-id": number
}

/** The table's default spec id must match the requirement's `default-spec-id` */
export type AssertDefaultSpecId = BaseTableRequirement & {
  type?: "assert-default-spec-id"
  "default-spec-id": number
}

/** The table's default sort order id must match the requirement's `default-sort-order-id` */
export type AssertDefaultSortOrderId = BaseTableRequirement & {
  type?: "assert-default-sort-order-id"
  "default-sort-order-id": number
}

export type ViewRequirement = BaseViewRequirement &
  BaseViewRequirementTypeMapping<"assert-view-uuid", AssertViewUUID>

/** The view UUID must match the requirement's `uuid` */
export interface AssertViewUUID {
  type: "assert-view-uuid"
  uuid: string
}

export interface StorageCredential {
  /** Indicates a storage location prefix where the credential is relevant. Clients should choose the most specific prefix (by selecting the longest prefix) if several credentials of the same type are available. */
  prefix: string
  config: Record<string, string>
}

export interface LoadCredentialsResponse {
  "storage-credentials": StorageCredential[]
}

/**
 * Result used when a table is successfully loaded.
 *
 *
 * The table metadata JSON is returned in the `metadata` field. The corresponding file location of table metadata should be returned in the `metadata-location` field, unless the metadata is not yet committed. For example, a create transaction may return metadata that is staged but not committed.
 * Clients can check whether metadata has changed by comparing metadata locations after the table has been created.
 *
 *
 * The `config` map returns table-specific configuration for the table's resources, including its HTTP client and FileIO. For example, config may contain a specific FileIO implementation class for the table depending on its underlying storage.
 *
 *
 * The following configurations should be respected by clients:
 *
 * ## General Configurations
 *
 * - `token`: Authorization bearer token to use for table requests if OAuth2 security is enabled
 *
 * ## AWS Configurations
 *
 * The following configurations should be respected when working with tables stored in AWS S3
 *  - `client.region`: region to configure client for making requests to AWS
 *  - `s3.access-key-id`: id for credentials that provide access to the data in S3
 *  - `s3.secret-access-key`: secret for credentials that provide access to data in S3
 *  - `s3.session-token`: if present, this value should be used for as the session token
 *  - `s3.remote-signing-enabled`: if `true` remote signing should be performed as described in the `s3-signer-open-api.yaml` specification
 *  - `s3.cross-region-access-enabled`: if `true`, S3 Cross-Region bucket access is enabled
 *
 * ## Storage Credentials
 *
 * Credentials for ADLS / GCS / S3 / ... are provided through the `storage-credentials` field.
 * Clients must first check whether the respective credentials exist in the `storage-credentials` field before checking the `config` for credentials.
 */
export interface LoadTableResult {
  /** May be null if the table is staged as part of a transaction */
  "metadata-location"?: string
  metadata: TableMetadata
  config?: Record<string, string>
  "storage-credentials"?: StorageCredential[]
}

/**
 * Scan and planning tasks for server-side scan planning
 *
 * - `plan-tasks` contains opaque units of planning work
 * - `file-scan-tasks` contains a partial or complete list of table scan tasks
 * - `delete-files` contains delete files referenced by file scan tasks
 *
 * Each plan task must be passed to the fetchScanTasks endpoint to fetch the file scan tasks for the plan task.
 *
 * The list of delete files must contain all delete files referenced by the file scan tasks.
 */
export interface ScanTasks {
  /** Delete files referenced by file scan tasks */
  "delete-files"?: DeleteFile[]
  "file-scan-tasks"?: FileScanTask[]
  "plan-tasks"?: PlanTask[]
}

/** Completed server-side planning result */
export type CompletedPlanningResult = ScanTasks & {
  /** Status of a server-side planning operation */
  status: PlanStatus
}

export type CompletedPlanningWithIDResult = CompletedPlanningResult & {
  /** ID used to track a planning request */
  "plan-id"?: string
}

/** Failed server-side planning result */
export type FailedPlanningResult = IcebergErrorResponse & {
  /** Status of a server-side planning operation */
  status: PlanStatus
}

export interface AsyncPlanningResult {
  /** Status of a server-side planning operation */
  status: PlanStatus
  /** ID used to track a planning request */
  "plan-id"?: string
}

/** Empty server-side planning result */
export interface EmptyPlanningResult {
  /** Status of a server-side planning operation */
  status: PlanStatus
}

/** Status of a server-side planning operation */
export enum PlanStatus {
  Completed = "completed",
  Submitted = "submitted",
  Cancelled = "cancelled",
  Failed = "failed",
}

/** Result of server-side scan planning for fetchPlanningResult */
export type FetchPlanningResult = BaseFetchPlanningResult &
  (
    | BaseFetchPlanningResultStatusMapping<"completed", CompletedPlanningResult>
    | BaseFetchPlanningResultStatusMapping<"submitted", EmptyPlanningResult>
    | BaseFetchPlanningResultStatusMapping<"cancelled", EmptyPlanningResult>
    | BaseFetchPlanningResultStatusMapping<"failed", FailedPlanningResult>
  )

/** Result of server-side scan planning for planTableScan */
export type PlanTableScanResult = BasePlanTableScanResult &
  (
    | BasePlanTableScanResultStatusMapping<
        "completed",
        CompletedPlanningWithIDResult
      >
    | BasePlanTableScanResultStatusMapping<"submitted", AsyncPlanningResult>
    | BasePlanTableScanResultStatusMapping<"cancelled", EmptyPlanningResult>
    | BasePlanTableScanResultStatusMapping<"failed", FailedPlanningResult>
  )

/** Response schema for fetchScanTasks */
export type FetchScanTasksResult = ScanTasks

export interface CommitTableRequest {
  /** Table identifier to update; must be present for CommitTransactionRequest */
  identifier?: TableIdentifier
  requirements: TableRequirement[]
  updates: TableUpdate[]
}

export interface CommitViewRequest {
  /** View identifier to update */
  identifier?: TableIdentifier
  requirements?: ViewRequirement[]
  updates: ViewUpdate[]
}

export interface CommitTransactionRequest {
  "table-changes": CommitTableRequest[]
}

export interface CreateTableRequest {
  name: string
  location?: string
  schema: Schema
  "partition-spec"?: PartitionSpec
  "write-order"?: SortOrder
  "stage-create"?: boolean
  properties?: Record<string, string>
}

export interface RegisterTableRequest {
  name: string
  "metadata-location": string
  /**
   * Whether to overwrite table metadata if the table already exists
   * @default false
   */
  overwrite?: boolean
}

export interface CreateViewRequest {
  name: string
  location?: string
  schema: Schema
  /** The view version to create, will replace the schema-id sent within the view-version with the id assigned to the provided schema */
  "view-version": ViewVersion
  properties: Record<string, string>
}

/**
 * Result used when a view is successfully loaded.
 *
 *
 * The view metadata JSON is returned in the `metadata` field. The corresponding file location of view metadata is returned in the `metadata-location` field.
 * Clients can check whether metadata has changed by comparing metadata locations after the view has been created.
 *
 * The `config` map returns view-specific configuration for the view's resources.
 *
 * The following configurations should be respected by clients:
 *
 * ## General Configurations
 *
 * - `token`: Authorization bearer token to use for view requests if OAuth2 security is enabled
 */
export interface LoadViewResult {
  "metadata-location": string
  metadata: ViewMetadata
  config?: Record<string, string>
}

/**
 * Token type identifier, from RFC 8693 Section 3
 *
 * See https://datatracker.ietf.org/doc/html/rfc8693#section-3
 */
export enum TokenType {
  UrnIetfParamsOauthTokenTypeAccessToken = "urn:ietf:params:oauth:token-type:access_token",
  UrnIetfParamsOauthTokenTypeRefreshToken = "urn:ietf:params:oauth:token-type:refresh_token",
  UrnIetfParamsOauthTokenTypeIdToken = "urn:ietf:params:oauth:token-type:id_token",
  UrnIetfParamsOauthTokenTypeSaml1 = "urn:ietf:params:oauth:token-type:saml1",
  UrnIetfParamsOauthTokenTypeSaml2 = "urn:ietf:params:oauth:token-type:saml2",
  UrnIetfParamsOauthTokenTypeJwt = "urn:ietf:params:oauth:token-type:jwt",
}

/**
 * The `oauth/tokens` endpoint and related schemas are **DEPRECATED for REMOVAL** from this spec, see description of the endpoint.
 *
 * OAuth2 client credentials request
 *
 * See https://datatracker.ietf.org/doc/html/rfc6749#section-4.4
 * @deprecated
 */
export interface OAuthClientCredentialsRequest {
  grant_type: "client_credentials"
  scope?: string
  /**
   * Client ID
   *
   * This can be sent in the request body, but OAuth2 recommends sending it in a Basic Authorization header.
   */
  client_id: string
  /**
   * Client secret
   *
   * This can be sent in the request body, but OAuth2 recommends sending it in a Basic Authorization header.
   */
  client_secret: string
}

/**
 * The `oauth/tokens` endpoint and related schemas are **DEPRECATED for REMOVAL** from this spec, see description of the endpoint.
 *
 * OAuth2 token exchange request
 *
 * See https://datatracker.ietf.org/doc/html/rfc8693
 * @deprecated
 */
export interface OAuthTokenExchangeRequest {
  grant_type: "urn:ietf:params:oauth:grant-type:token-exchange"
  scope?: string
  /**
   * Token type identifier, from RFC 8693 Section 3
   *
   * See https://datatracker.ietf.org/doc/html/rfc8693#section-3
   */
  requested_token_type?: TokenType
  /** Subject token for token exchange request */
  subject_token: string
  /**
   * Token type identifier, from RFC 8693 Section 3
   *
   * See https://datatracker.ietf.org/doc/html/rfc8693#section-3
   */
  subject_token_type: TokenType
  /** Actor token for token exchange request */
  actor_token?: string
  /**
   * Token type identifier, from RFC 8693 Section 3
   *
   * See https://datatracker.ietf.org/doc/html/rfc8693#section-3
   */
  actor_token_type?: TokenType
}

/**
 * The `oauth/tokens` endpoint and related schemas are **DEPRECATED for REMOVAL** from this spec, see description of the endpoint.
 * @deprecated
 */
export type OAuthTokenRequest =
  | OAuthClientCredentialsRequest
  | OAuthTokenExchangeRequest

export interface CounterResult {
  unit: string
  /** @format int64 */
  value: number
}

export interface TimerResult {
  "time-unit": string
  /** @format int64 */
  count: number
  /** @format int64 */
  "total-duration": number
}

export type MetricResult = CounterResult | TimerResult

/** @example {"metrics":{"total-planning-duration":{"count":1,"time-unit":"nanoseconds","total-duration":2644235116},"result-data-files":{"unit":"count","value":1},"result-delete-files":{"unit":"count","value":0},"total-data-manifests":{"unit":"count","value":1},"total-delete-manifests":{"unit":"count","value":0},"scanned-data-manifests":{"unit":"count","value":1},"skipped-data-manifests":{"unit":"count","value":0},"total-file-size-bytes":{"unit":"bytes","value":10},"total-delete-file-size-bytes":{"unit":"bytes","value":0}}} */
export type Metrics = Record<string, MetricResult>

export type ReportMetricsRequest = (ScanReport | CommitReport) & {
  "report-type": string
}

export interface ScanReport {
  "table-name": string
  /** @format int64 */
  "snapshot-id": string
  filter: Expression
  "schema-id": number
  "projected-field-ids": number[]
  "projected-field-names": string[]
  metrics: Metrics
  metadata?: Record<string, string>
}

export interface CommitReport {
  "table-name": string
  /** @format int64 */
  "snapshot-id": string
  /** @format int64 */
  "sequence-number": number
  operation: string
  metrics: Metrics
  metadata?: Record<string, string>
}

/**
 * The `oauth/tokens` endpoint and related schemas are **DEPRECATED for REMOVAL** from this spec, see description of the endpoint.
 * @deprecated
 */
export interface OAuthError {
  error:
    | "invalid_request"
    | "invalid_client"
    | "invalid_grant"
    | "unauthorized_client"
    | "unsupported_grant_type"
    | "invalid_scope"
  error_description?: string
  error_uri?: string
}

/**
 * The `oauth/tokens` endpoint and related schemas are **DEPRECATED for REMOVAL** from this spec, see description of the endpoint.
 * @deprecated
 */
export interface OAuthTokenResponse {
  /** The access token, for client credentials or token exchange */
  access_token: string
  /**
   * Access token type for client credentials or token exchange
   *
   * See https://datatracker.ietf.org/doc/html/rfc6749#section-7.1
   */
  token_type: "bearer" | "mac" | "N_A"
  /** Lifetime of the access token in seconds for client credentials or token exchange */
  expires_in?: number
  /**
   * Token type identifier, from RFC 8693 Section 3
   *
   * See https://datatracker.ietf.org/doc/html/rfc8693#section-3
   */
  issued_token_type?: TokenType
  /** Refresh token for client credentials or token exchange */
  refresh_token?: string
  /** Authorization scope for client credentials or token exchange */
  scope?: string
}

/**
 * JSON wrapper for all error responses (non-2xx)
 * @example {"error":{"message":"The server does not support this operation","type":"UnsupportedOperationException","code":406}}
 */
export interface IcebergErrorResponse {
  /** JSON error payload returned in a response with further details on the error */
  error: ErrorModel
}

export interface CreateNamespaceResponse {
  /** Reference to one or more levels of a namespace */
  namespace: Namespace
  /**
   * Properties stored on the namespace, if supported by the server.
   * @default {}
   * @example {"owner":"Ralph","created_at":"1452120468"}
   */
  properties?: Record<string, string>
}

export interface GetNamespaceResponse {
  /** Reference to one or more levels of a namespace */
  namespace: Namespace
  /**
   * Properties stored on the namespace, if supported by the server. If the server does not support namespace properties, it should return null for this field. If namespace properties are supported, but none are set, it should return an empty object.
   * @default {}
   * @example {"owner":"Ralph","transient_lastDdlTime":"1452120468"}
   */
  properties?: Record<string, string>
}

export interface ListTablesResponse {
  /**
   * An opaque token that allows clients to make use of pagination for list APIs (e.g. ListTables). Clients may initiate the first paginated request by sending an empty query parameter `pageToken` to the server.
   * Servers that support pagination should identify the `pageToken` parameter and return a `next-page-token` in the response if there are more results available.  After the initial request, the value of `next-page-token` from each response must be used as the `pageToken` parameter value for the next request. The server must return `null` value for the `next-page-token` in the last response.
   * Servers that support pagination must return all results in a single response with the value of `next-page-token` set to `null` if the query parameter `pageToken` is not set in the request.
   * Servers that do not support pagination should ignore the `pageToken` parameter and return all results in a single response. The `next-page-token` must be omitted from the response.
   * Clients must interpret either `null` or missing response value of `next-page-token` as the end of the listing results.
   */
  "next-page-token"?: PageToken
  /** @uniqueItems true */
  identifiers?: TableIdentifier[]
}

export interface ListNamespacesResponse {
  /**
   * An opaque token that allows clients to make use of pagination for list APIs (e.g. ListTables). Clients may initiate the first paginated request by sending an empty query parameter `pageToken` to the server.
   * Servers that support pagination should identify the `pageToken` parameter and return a `next-page-token` in the response if there are more results available.  After the initial request, the value of `next-page-token` from each response must be used as the `pageToken` parameter value for the next request. The server must return `null` value for the `next-page-token` in the last response.
   * Servers that support pagination must return all results in a single response with the value of `next-page-token` set to `null` if the query parameter `pageToken` is not set in the request.
   * Servers that do not support pagination should ignore the `pageToken` parameter and return all results in a single response. The `next-page-token` must be omitted from the response.
   * Clients must interpret either `null` or missing response value of `next-page-token` as the end of the listing results.
   */
  "next-page-token"?: PageToken
  /** @uniqueItems true */
  namespaces?: Namespace[]
}

export interface UpdateNamespacePropertiesResponse {
  /**
   * List of property keys that were added or updated
   * @uniqueItems true
   */
  updated: string[]
  /** List of properties that were removed */
  removed: string[]
  /** List of properties requested for removal that were not found in the namespace's properties. Represents a partial success response. Server's do not need to implement this. */
  missing?: string[] | null
}

export interface CommitTableResponse {
  "metadata-location": string
  metadata: TableMetadata
}

export interface StatisticsFile {
  /** @format int64 */
  "snapshot-id": string
  "statistics-path": string
  /** @format int64 */
  "file-size-in-bytes": number
  /** @format int64 */
  "file-footer-size-in-bytes": number
  "blob-metadata": BlobMetadata[]
}

export interface BlobMetadata {
  type: string
  /** @format int64 */
  "snapshot-id": string
  /** @format int64 */
  "sequence-number": number
  fields: number[]
  properties?: Record<string, string>
}

export interface PartitionStatisticsFile {
  /** @format int64 */
  "snapshot-id": string
  "statistics-path": string
  /** @format int64 */
  "file-size-in-bytes": number
}

/** @example true */
export type BooleanTypeValue = boolean

/** @example 42 */
export type IntegerTypeValue = number

/**
 * @format int64
 * @example 9223372036854776000
 */
export type LongTypeValue = number

/**
 * @format float
 * @example 3.14
 */
export type FloatTypeValue = number

/**
 * @format double
 * @example 123.456
 */
export type DoubleTypeValue = number

/**
 * Decimal type values are serialized as strings. Decimals with a positive scale serialize as numeric plain  text, while decimals with a negative scale use scientific notation and the exponent will be equal to the  negated scale. For instance, a decimal with a positive scale is '123.4500', with zero scale is '2',  and with a negative scale is '2E+20'
 * @example "123.4500"
 */
export type DecimalTypeValue = string

/** @example "hello" */
export type StringTypeValue = string

/**
 * UUID type values are serialized as a 36-character lowercase string in standard UUID format as specified  by RFC-4122
 * @format uuid
 * @minLength 36
 * @maxLength 36
 * @pattern ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
 * @example "eb26bdb1-a1d8-4aa6-990e-da940875492c"
 */
export type UUIDTypeValue = string

/**
 * Date type values follow the 'YYYY-MM-DD' ISO-8601 standard date format
 * @format date
 * @example "2007-12-03"
 */
export type DateTypeValue = string

/**
 * Time type values follow the 'HH:MM:SS.ssssss' ISO-8601 format with microsecond precision
 * @example "22:31:08.123456"
 */
export type TimeTypeValue = string

/**
 * Timestamp type values follow the 'YYYY-MM-DDTHH:MM:SS.ssssss' ISO-8601 format with microsecond precision
 * @example "2007-12-03T10:15:30.123456"
 */
export type TimestampTypeValue = string

/**
 * TimestampTz type values follow the 'YYYY-MM-DDTHH:MM:SS.ssssss+00:00' ISO-8601 format with microsecond precision,  and a timezone offset (+00:00 for UTC)
 * @example "2007-12-03T10:15:30.123456+00:00"
 */
export type TimestampTzTypeValue = string

/**
 * Timestamp_ns type values follow the 'YYYY-MM-DDTHH:MM:SS.sssssssss' ISO-8601 format with nanosecond precision
 * @example "2007-12-03T10:15:30.123456789"
 */
export type TimestampNanoTypeValue = string

/**
 * Timestamp_ns type values follow the 'YYYY-MM-DDTHH:MM:SS.sssssssss+00:00' ISO-8601 format with nanosecond  precision, and a timezone offset (+00:00 for UTC)
 * @example "2007-12-03T10:15:30.123456789+00:00"
 */
export type TimestampTzNanoTypeValue = string

/**
 * Fixed length type values are stored and serialized as an uppercase hexadecimal string  preserving the fixed length
 * @example "78797A"
 */
export type FixedTypeValue = string

/**
 * Binary type values are stored and serialized as an uppercase hexadecimal string
 * @example "78797A"
 */
export type BinaryTypeValue = string

/** @example {"keys":[1,2],"values":[100,200]} */
export interface CountMap {
  /** List of integer column ids for each corresponding value */
  keys?: IntegerTypeValue[]
  /** List of Long values, matched to 'keys' by index */
  values?: LongTypeValue[]
}

/** @example {"keys":[1,2],"values":[100,"test"]} */
export interface ValueMap {
  /** List of integer column ids for each corresponding value */
  keys?: IntegerTypeValue[]
  /** List of primitive type values, matched to 'keys' by index */
  values?: PrimitiveTypeValue[]
}

export type PrimitiveTypeValue =
  | BooleanTypeValue
  | IntegerTypeValue
  | LongTypeValue
  | FloatTypeValue
  | DoubleTypeValue
  | DecimalTypeValue
  | StringTypeValue
  | UUIDTypeValue
  | DateTypeValue
  | TimeTypeValue
  | TimestampTypeValue
  | TimestampTzTypeValue
  | TimestampNanoTypeValue
  | TimestampTzNanoTypeValue
  | FixedTypeValue
  | BinaryTypeValue

export enum FileFormat {
  Avro = "avro",
  Orc = "orc",
  Parquet = "parquet",
  Puffin = "puffin",
}

export type ContentFile = BaseContentFile &
  (
    | BaseContentFileContentMapping<"data", DataFile>
    | BaseContentFileContentMapping<"position-deletes", PositionDeleteFile>
    | BaseContentFileContentMapping<"equality-deletes", EqualityDeleteFile>
  )

export type DataFile = UtilRequiredKeys<BaseContentFile, "content"> & {
  content: "data"
  /** Map of column id to total count, including null and NaN */
  "column-sizes"?: CountMap
  /** Map of column id to null value count */
  "value-counts"?: CountMap
  /** Map of column id to null value count */
  "null-value-counts"?: CountMap
  /** Map of column id to number of NaN values in the column */
  "nan-value-counts"?: CountMap
  /** Map of column id to lower bound primitive type values */
  "lower-bounds"?: ValueMap
  /** Map of column id to upper bound primitive type values */
  "upper-bounds"?: ValueMap
}

export type DeleteFile =
  | ({
      content: "position-deletes"
    } & PositionDeleteFile)
  | ({
      content: "equality-deletes"
    } & EqualityDeleteFile)

export type PositionDeleteFile = UtilRequiredKeys<
  BaseContentFile,
  "content"
> & {
  content: "position-deletes"
  /**
   * Offset within the delete file of delete content
   * @format int64
   */
  "content-offset"?: number
  /**
   * Length, in bytes, of the delete content; required if content-offset is present
   * @format int64
   */
  "content-size-in-bytes"?: number
}

export type EqualityDeleteFile = UtilRequiredKeys<
  BaseContentFile,
  "content"
> & {
  content: "equality-deletes"
  /** List of equality field IDs */
  "equality-ids"?: number[]
}

export interface PlanTableScanRequest {
  /**
   * Identifier for the snapshot to scan in a point-in-time scan
   * @format int64
   */
  "snapshot-id"?: string
  /** List of selected schema fields */
  select?: FieldName[]
  /** Expression used to filter the table data */
  filter?: Expression
  /**
   * Enables case sensitive field matching for filter and select
   * @default true
   */
  "case-sensitive"?: boolean
  /**
   * Whether to use the schema at the time the snapshot was written.
   * When time travelling, the snapshot schema should be used (true). When scanning a branch, the table schema should be used (false).
   * @default false
   */
  "use-snapshot-schema"?: boolean
  /**
   * Starting snapshot ID for an incremental scan (exclusive)
   * @format int64
   */
  "start-snapshot-id"?: string
  /**
   * Ending snapshot ID for an incremental scan (inclusive).
   * Required when start-snapshot-id is specified.
   * @format int64
   */
  "end-snapshot-id"?: string
  /** List of fields for which the service should send column stats. */
  "stats-fields"?: FieldName[]
}

/**
 * A full field name (including parent field names), such as those passed in APIs like Java `Schema#findField(String name)`.
 * The nested field name follows these rules - Nested struct fields are named by concatenating field names at each struct level using dot (`.`) delimiter, e.g. employer.contact_info.address.zip_code - Nested fields in a map key are named using the keyword `key`, e.g. employee_address_map.key.first_name - Nested fields in a map value are named using the keyword `value`, e.g. employee_address_map.value.zip_code - Nested fields in a list are named using the keyword `element`, e.g. employees.element.first_name
 */
export type FieldName = string

export interface FetchScanTasksRequest {
  /** An opaque string provided by the REST server that represents a unit of work to produce file scan tasks for scan planning. This allows clients to fetch tasks across multiple requests to accommodate large result sets. */
  "plan-task": PlanTask
}

/** An opaque string provided by the REST server that represents a unit of work to produce file scan tasks for scan planning. This allows clients to fetch tasks across multiple requests to accommodate large result sets. */
export type PlanTask = string

export interface FileScanTask {
  "data-file": DataFile
  /** A list of indices in the delete files array (0-based) */
  "delete-file-references"?: number[]
  /**
   * An optional filter to be applied to rows in this file scan task.
   * If the residual is not present, the client must produce the residual or use the original filter.
   */
  "residual-filter"?: Expression
}

interface BaseBaseUpdate {
  action: string
}

type BaseBaseUpdateActionMapping<Key, Type> = {
  action: Key
} & Type

interface BaseTableRequirement {
  type: string
}

type BaseTableRequirementTypeMapping<Key, Type> = {
  type: Key
} & Type

type BaseViewRequirement = object

type BaseViewRequirementTypeMapping<Key, Type> = {
  type: Key
} & Type

/** Result of server-side scan planning for fetchPlanningResult */
type BaseFetchPlanningResult = object

type BaseFetchPlanningResultStatusMapping<Key, Type> = {
  status: Key
} & Type

/** Result of server-side scan planning for planTableScan */
type BasePlanTableScanResult = object

type BasePlanTableScanResultStatusMapping<Key, Type> = {
  status: Key
} & Type

interface BaseContentFile {
  content: string
  "file-path": string
  "file-format": FileFormat
  "spec-id": number
  /**
   * A list of partition field values ordered based on the fields of the partition spec specified by the `spec-id`
   * @example [1,"bar"]
   */
  partition: PrimitiveTypeValue[]
  /**
   * Total file size in bytes
   * @format int64
   */
  "file-size-in-bytes": number
  /**
   * Number of records in the file
   * @format int64
   */
  "record-count": number
  /** Encryption key metadata blob */
  "key-metadata"?: BinaryTypeValue
  /** List of splittable offsets */
  "split-offsets"?: number[]
  "sort-order-id"?: number
}

type BaseContentFileContentMapping<Key, Type> = {
  content: Key
} & Type

export type QueryParamsType = Record<string | number, any>
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean
  /** request path */
  path: string
  /** content type of request body */
  type?: ContentType
  /** query params */
  query?: QueryParamsType
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat
  /** request body */
  body?: unknown
  /** base url */
  baseUrl?: string
  /** request cancellation token */
  cancelToken?: CancelToken
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">
  securityWorker?: (
    securityData: SecurityDataType | null
  ) => Promise<RequestParams | void> | RequestParams | void
  customFetch?: typeof fetch
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D
  error: E
}

type CancelToken = Symbol | string | number

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "{scheme}://{host}/{basePath}"
  private securityData: SecurityDataType | null = null
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"]
  private abortControllers = new Map<CancelToken, AbortController>()
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams)

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  }

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig)
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data
  }

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key)
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key])
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key]
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&")
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {}
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key]
    )
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key)
      )
      .join("&")
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery)
    return queryString ? `?${queryString}` : ""
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key]
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`
        )
        return formData
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  }

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    }
  }

  protected createAbortSignal = (
    cancelToken: CancelToken
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken)
      if (abortController) {
        return abortController.signal
      }
      return void 0
    }

    const abortController = new AbortController()
    this.abortControllers.set(cancelToken, abortController)
    return abortController.signal
  }

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken)

    if (abortController) {
      abortController.abort()
      this.abortControllers.delete(cancelToken)
    }
  }

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<T> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {}
    const requestParams = this.mergeRequestParams(params, secureParams)
    const queryString = query && this.toQueryString(query)
    const payloadFormatter = this.contentFormatters[type || ContentType.Json]
    const responseFormat = format || requestParams.format

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      }
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>
      r.data = null as unknown as T
      r.error = null as unknown as E

      // Parse snapshot-id as strings because it may be greater than MAX_SAFE_INTEGER.
      // Also: avoid throwing SyntaxError when the server returns non-JSON (e.g. HTML 404 pages).
      const JSONbigintString = require("json-bigint")({ storeAsString: true })

      const parseBody = async () => {
        if (!responseFormat) return null

        if (responseFormat === "json") {
          const raw = await response.text()
          if (!raw) return {}
          try {
            return JSONbigintString.parse(raw)
          } catch (e) {
            if (r.ok) {
              throw e
            }
            // Fall back to a clean error message instead of bubbling up "Unexpected '<'".
            const statusText = response.statusText || "Error"
            const isHtml = /<!doctype|<html[\s>]/i.test(raw)
            throw {
              message: `HTTP ${response.status} ${statusText}`,
              // Do not leak HTML into UI toasts; keep raw text only when it's not HTML.
              details: isHtml ? "" : raw.slice(0, 500),
            }
          }
        }

        // @ts-expect-error - index access is safe here
        return await response[responseFormat]()
      }

      const data = !responseFormat
        ? r
        : await parseBody()
            .then((data) => {
              if (r.ok) {
                r.data = data
              } else {
                r.error = data
              }
              return r
            })
            .catch((e) => {
              r.error = e
              return r
            })

      if (cancelToken) {
        this.abortControllers.delete(cancelToken)
      }

      if (!response.ok) throw r.error
      return data.data
    })
  }
}

/**
 * @title Apache Iceberg REST Catalog API
 * @version 0.0.1
 * @license Apache 2.0 (https://www.apache.org/licenses/LICENSE-2.0.html)
 * @baseUrl {scheme}://{host}/{basePath}
 *
 * Defines the specification for the first version of the REST Catalog API. Implementations should ideally support both Iceberg table specs v1 and v2, with priority given to v2.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  v1 = {
    /**
     * @description All REST clients should first call this route to get catalog configuration properties from the server to configure the catalog and its HTTP client. Configuration from the server consists of two sets of key/value pairs. - defaults -  properties that should be used as default configuration; applied before client configuration - overrides - properties that should be used to override client configuration; applied after defaults and client configuration Catalog configuration is constructed by setting the defaults, then client- provided configuration, and finally overrides. The final property set is then used to configure the catalog. For example, a default configuration property might set the size of the client pool, which can be replaced with a client-specific setting. An override might be used to set the warehouse location, which is stored on the server rather than in client configuration. Common catalog configuration settings are documented at https://iceberg.apache.org/docs/latest/configuration/#catalog-properties The catalog configuration also holds an optional `endpoints` field that contains information about the endpoints supported by the server. If a server does not send the `endpoints` field, a default set of endpoints is assumed: - GET /v1/{prefix}/namespaces - POST /v1/{prefix}/namespaces - GET /v1/{prefix}/namespaces/{namespace} - HEAD /v1/{prefix}/namespaces/{namespace} - DELETE /v1/{prefix}/namespaces/{namespace} - POST /v1/{prefix}/namespaces/{namespace}/properties - GET /v1/{prefix}/namespaces/{namespace}/tables - POST /v1/{prefix}/namespaces/{namespace}/tables - GET /v1/{prefix}/namespaces/{namespace}/tables/{table} - HEAD /v1/{prefix}/namespaces/{namespace}/tables/{table} - POST /v1/{prefix}/namespaces/{namespace}/tables/{table} - DELETE /v1/{prefix}/namespaces/{namespace}/tables/{table} - POST /v1/{prefix}/namespaces/{namespace}/register - POST /v1/{prefix}/namespaces/{namespace}/tables/{table}/metrics - POST /v1/{prefix}/tables/rename - POST /v1/{prefix}/transactions/commit
     *
     * @tags Configuration API
     * @name GetConfig
     * @summary List all catalog configuration settings
     * @request GET:/v1/config
     * @secure
     */
    getConfig: (
      query?: {
        /** Warehouse location or identifier to request from the service */
        warehouse?: string
      },
      params: RequestParams = {}
    ) =>
      this.request<CatalogConfig, IcebergErrorResponse>({
        path: `/v1/config`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description The `oauth/tokens` endpoint is **DEPRECATED for REMOVAL**. It is _not_ recommended to implement this endpoint, unless you are fully aware of the potential security implications. All clients are encouraged to explicitly set the configuration property `oauth2-server-uri` to the correct OAuth endpoint. Deprecated since Iceberg (Java) 1.6.0. The endpoint and related types will be removed from this spec in Iceberg (Java) 2.0. See [Security improvements in the Iceberg REST specification](https://github.com/apache/iceberg/issues/10537) Exchange credentials for a token using the OAuth2 client credentials flow or token exchange. This endpoint is used for three purposes - 1. To exchange client credentials (client ID and secret) for an access token This uses the client credentials flow. 2. To exchange a client token and an identity token for a more specific access token This uses the token exchange flow. 3. To exchange an access token for one with the same claims and a refreshed expiration period This uses the token exchange flow. For example, a catalog client may be configured with client credentials from the OAuth2 Authorization flow. This client would exchange its client ID and secret for an access token using the client credentials request with this endpoint (1). Subsequent requests would then use that access token. Some clients may also handle sessions that have additional user context. These clients would use the token exchange flow to exchange a user token (the "subject" token) from the session for a more specific access token for that user, using the catalog's access token as the "actor" token (2). The user ID token is the "subject" token and can be any token type allowed by the OAuth2 token exchange flow, including a unsecured JWT token with a sub claim. This request should use the catalog's bearer token in the "Authorization" header. Clients may also use the token exchange flow to refresh a token that is about to expire by sending a token exchange request (3). The request's "subject" token should be the expiring token. This request should use the subject token in the "Authorization" header.
     *
     * @tags OAuth2 API
     * @name GetToken
     * @summary Get a token using an OAuth2 flow (DEPRECATED for REMOVAL)
     * @request POST:/v1/oauth/tokens
     * @deprecated
     * @secure
     */
    getToken: (data: OAuthTokenRequest, params: RequestParams = {}) =>
      this.request<OAuthTokenResponse, OAuthError>({
        path: `/v1/oauth/tokens`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.UrlEncoded,
        format: "json",
        ...params,
      }),

    /**
     * @description List all namespaces at a certain level, optionally starting from a given parent namespace. If table accounting.tax.paid.info exists, using 'SELECT NAMESPACE IN accounting' would translate into `GET /namespaces?parent=accounting` and must return a namespace, ["accounting", "tax"] only. Using 'SELECT NAMESPACE IN accounting.tax' would translate into `GET /namespaces?parent=accounting%1Ftax` and must return a namespace, ["accounting", "tax", "paid"]. If `parent` is not provided, all top-level namespaces should be listed.
     *
     * @tags Catalog API
     * @name ListNamespaces
     * @summary List namespaces, optionally providing a parent namespace to list underneath
     * @request GET:/v1/{prefix}/namespaces
     * @secure
     */
    listNamespaces: (
      query?: {
        /**
         * An opaque token that allows clients to make use of pagination for list APIs (e.g. ListTables). Clients may initiate the first paginated request by sending an empty query parameter `pageToken` to the server.
         * Servers that support pagination should identify the `pageToken` parameter and return a `next-page-token` in the response if there are more results available.  After the initial request, the value of `next-page-token` from each response must be used as the `pageToken` parameter value for the next request. The server must return `null` value for the `next-page-token` in the last response.
         * Servers that support pagination must return all results in a single response with the value of `next-page-token` set to `null` if the query parameter `pageToken` is not set in the request.
         * Servers that do not support pagination should ignore the `pageToken` parameter and return all results in a single response. The `next-page-token` must be omitted from the response.
         * Clients must interpret either `null` or missing response value of `next-page-token` as the end of the listing results.
         */
        pageToken?: PageToken
        /**
         * For servers that support pagination, this signals an upper bound of the number of results that a client will receive. For servers that do not support pagination, clients may receive results larger than the indicated `pageSize`.
         * @min 1
         */
        pageSize?: number
        /**
         * An optional namespace, underneath which to list namespaces. If not provided or empty, all top-level namespaces should be listed. If parent is a multipart namespace, the parts must be separated by the unit separator (`0x1F`) byte.
         * @example "accounting%1Ftax"
         */
        parent?: string
      },
      params: RequestParams = {}
    ) =>
      this.request<ListNamespacesResponse, IcebergErrorResponse>({
        path: `/v1/namespaces`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a namespace, with an optional set of properties. The server might also add properties, such as `last_modified_time` etc.
     *
     * @tags Catalog API
     * @name CreateNamespace
     * @summary Create a namespace
     * @request POST:/v1/{prefix}/namespaces
     * @secure
     */
    createNamespace: (
      data: CreateNamespaceRequest,
      params: RequestParams = {}
    ) =>
      this.request<CreateNamespaceResponse, IcebergErrorResponse | ErrorModel>({
        path: `/v1/namespaces`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Return all stored metadata properties for a given namespace
     *
     * @tags Catalog API
     * @name LoadNamespaceMetadata
     * @summary Load the metadata properties for a namespace
     * @request GET:/v1/{prefix}/namespaces/{namespace}
     * @secure
     */
    loadNamespaceMetadata: (namespace: string, params: RequestParams = {}) =>
      this.request<GetNamespaceResponse, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Check if a namespace exists. The response does not contain a body.
     *
     * @tags Catalog API
     * @name NamespaceExists
     * @summary Check if a namespace exists
     * @request HEAD:/v1/{prefix}/namespaces/{namespace}
     * @secure
     */
    namespaceExists: (namespace: string, params: RequestParams = {}) =>
      this.request<void, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}`,
        method: "HEAD",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog API
     * @name DropNamespace
     * @summary Drop a namespace from the catalog. Namespace must be empty.
     * @request DELETE:/v1/{prefix}/namespaces/{namespace}
     * @secure
     */
    dropNamespace: (namespace: string, params: RequestParams = {}) =>
      this.request<void, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Set and/or remove properties on a namespace. The request body specifies a list of properties to remove and a map of key value pairs to update. Properties that are not in the request are not modified or removed by this call. Server implementations are not required to support namespace properties.
     *
     * @tags Catalog API
     * @name UpdateProperties
     * @summary Set or remove properties on a namespace
     * @request POST:/v1/{prefix}/namespaces/{namespace}/properties
     * @secure
     */
    updateProperties: (
      namespace: string,
      data: UpdateNamespacePropertiesRequest,
      params: RequestParams = {}
    ) =>
      this.request<
        UpdateNamespacePropertiesResponse,
        IcebergErrorResponse | ErrorModel
      >({
        path: `/v1/namespaces/${namespace}/properties`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Return all table identifiers under this namespace
     *
     * @tags Catalog API
     * @name ListTables
     * @summary List all table identifiers underneath a given namespace
     * @request GET:/v1/{prefix}/namespaces/{namespace}/tables
     * @secure
     */
    listTables: (
      namespace: string,
      query?: {
        /**
         * An opaque token that allows clients to make use of pagination for list APIs (e.g. ListTables). Clients may initiate the first paginated request by sending an empty query parameter `pageToken` to the server.
         * Servers that support pagination should identify the `pageToken` parameter and return a `next-page-token` in the response if there are more results available.  After the initial request, the value of `next-page-token` from each response must be used as the `pageToken` parameter value for the next request. The server must return `null` value for the `next-page-token` in the last response.
         * Servers that support pagination must return all results in a single response with the value of `next-page-token` set to `null` if the query parameter `pageToken` is not set in the request.
         * Servers that do not support pagination should ignore the `pageToken` parameter and return all results in a single response. The `next-page-token` must be omitted from the response.
         * Clients must interpret either `null` or missing response value of `next-page-token` as the end of the listing results.
         */
        pageToken?: PageToken
        /**
         * For servers that support pagination, this signals an upper bound of the number of results that a client will receive. For servers that do not support pagination, clients may receive results larger than the indicated `pageSize`.
         * @min 1
         */
        pageSize?: number
      },
      params: RequestParams = {}
    ) =>
      this.request<ListTablesResponse, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a table or start a create transaction, like atomic CTAS. If `stage-create` is false, the table is created immediately. If `stage-create` is true, the table is not created, but table metadata is initialized and returned. The service should prepare as needed for a commit to the table commit endpoint to complete the create transaction. The client uses the returned metadata to begin a transaction. To commit the transaction, the client sends all create and subsequent changes to the table commit route. Changes from the table create operation include changes like AddSchemaUpdate and SetCurrentSchemaUpdate that set the initial table state.
     *
     * @tags Catalog API
     * @name CreateTable
     * @summary Create a table in the given namespace
     * @request POST:/v1/{prefix}/namespaces/{namespace}/tables
     * @secure
     */
    createTable: (
      namespace: string,
      data: CreateTableRequest,
      params: RequestParams = {}
    ) =>
      this.request<LoadTableResult, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Submits a scan for server-side planning. Point-in-time scans are planned by passing snapshot-id to identify the table snapshot to scan. Incremental scans are planned by passing both start-snapshot-id and end-snapshot-id. Requests that include both point in time config properties and incremental config properties are invalid. If the request does not include either incremental or point-in-time config properties, scan planning should produce a point-in-time scan of the latest snapshot in the table's main branch. Responses must include a valid status listed below. A "cancelled" status is considered invalid for this endpoint. - When "completed" the planning operation has produced plan tasks and file scan tasks that must be returned in the response (not fetched later by calling fetchPlanningResult) - When "submitted" the response must include a plan-id used to poll fetchPlanningResult to fetch the planning result when it is ready - When "failed" the response must be a valid error response The response for a "completed" planning operation includes two types of tasks (file scan tasks and plan tasks) and both may be included in the response. Tasks must not be included for any other response status. Responses that include a plan-id indicate that the service is holding state or performing work for the client. - Clients should use the plan-id to fetch results from fetchPlanningResult when the response status is "submitted" - Clients should inform the service if planning results are no longer needed by calling cancelPlanning. Cancellation is not necessary after fetchScanTasks has been used to fetch scan tasks for each plan task.
     *
     * @tags Catalog API
     * @name PlanTableScan
     * @summary Submit a scan for planning
     * @request POST:/v1/{prefix}/namespaces/{namespace}/tables/{table}/plan
     * @secure
     */
    planTableScan: (
      namespace: string,
      table: string,
      data: PlanTableScanRequest,
      params: RequestParams = {}
    ) =>
      this.request<PlanTableScanResult, IcebergErrorResponse | ErrorModel>({
        path: `/v1/namespaces/${namespace}/tables/${table}/plan`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Fetches the result of scan planning for a plan-id. Responses must include a valid status - When "completed" the planning operation has produced plan-tasks and file-scan-tasks that must be returned in the response - When "submitted" the planning operation has not completed; the client should wait to call this endpoint again to fetch a completed response - When "failed" the response must be a valid error response - When "cancelled" the plan-id is invalid and should be discarded The response for a "completed" planning operation includes two types of tasks (file scan tasks and plan tasks) and both may be included in the response. Tasks must not be included for any other response status.
     *
     * @tags Catalog API
     * @name FetchPlanningResult
     * @summary Fetches the result of scan planning for a plan-id
     * @request GET:/v1/{prefix}/namespaces/{namespace}/tables/{table}/plan/{plan-id}
     * @secure
     */
    fetchPlanningResult: (
      namespace: string,
      table: string,
      planId: string,
      params: RequestParams = {}
    ) =>
      this.request<FetchPlanningResult, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables/${table}/plan/${planId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Cancels scan planning for a plan-id. This notifies the service that it can release resources held for the scan. Clients should cancel scans that are no longer needed, either while the plan-id returns a "submitted" status or while there are remaining plan tasks that have not been fetched. Cancellation is not necessary when - Scan tasks for each plan task have been fetched using fetchScanTasks - A plan-id has produced a "failed" or "cancelled" status from planTableScan or fetchPlanningResult
     *
     * @tags Catalog API
     * @name CancelPlanning
     * @summary Cancels scan planning for a plan-id
     * @request DELETE:/v1/{prefix}/namespaces/{namespace}/tables/{table}/plan/{plan-id}
     * @secure
     */
    cancelPlanning: (
      namespace: string,
      table: string,
      planId: string,
      params: RequestParams = {}
    ) =>
      this.request<void, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables/${table}/plan/${planId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Fetches result tasks for a plan task.
     *
     * @tags Catalog API
     * @name FetchScanTasks
     * @summary Fetches result tasks for a plan task
     * @request POST:/v1/{prefix}/namespaces/{namespace}/tables/{table}/tasks
     * @secure
     */
    fetchScanTasks: (
      namespace: string,
      table: string,
      data: FetchScanTasksRequest,
      params: RequestParams = {}
    ) =>
      this.request<FetchScanTasksResult, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables/${table}/tasks`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Register a table using given metadata file location.
     *
     * @tags Catalog API
     * @name RegisterTable
     * @summary Register a table in the given namespace using given metadata file location
     * @request POST:/v1/{prefix}/namespaces/{namespace}/register
     * @secure
     */
    registerTable: (
      namespace: string,
      data: RegisterTableRequest,
      params: RequestParams = {}
    ) =>
      this.request<LoadTableResult, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/register`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Load a table from the catalog. The response contains both configuration and table metadata. The configuration, if non-empty is used as additional configuration for the table that overrides catalog configuration. For example, this configuration may change the FileIO implementation to be used for the table. The response also contains the table's full metadata, matching the table metadata JSON file. The catalog configuration may contain credentials that should be used for subsequent requests for the table. The configuration key "token" is used to pass an access token to be used as a bearer token for table requests. Otherwise, a token may be passed using a RFC 8693 token type as a configuration key. For example, "urn:ietf:params:oauth:token-type:jwt=<JWT-token>".
     *
     * @tags Catalog API
     * @name LoadTable
     * @summary Load a table from the catalog
     * @request GET:/v1/{prefix}/namespaces/{namespace}/tables/{table}
     * @secure
     */
    loadTable: (
      namespace: string,
      table: string,
      query?: {
        /**
         * The snapshots to return in the body of the metadata. Setting the value to `all` would return the full set of snapshots currently valid for the table. Setting the value to `refs` would load all snapshots referenced by branches or tags.
         * Default if no param is provided is `all`.
         */
        snapshots?: "all" | "refs"
      },
      params: RequestParams = {}
    ) =>
      this.request<LoadTableResult, void | IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables/${table}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Commit updates to a table. Commits have two parts, requirements and updates. Requirements are assertions that will be validated before attempting to make and commit changes. For example, `assert-ref-snapshot-id` will check that a named ref's snapshot ID has a certain value. Server implementations are required to fail with a 400 status code if any unknown updates or requirements are received. Updates are changes to make to table metadata. For example, after asserting that the current main ref is at the expected snapshot, a commit may add a new child snapshot and set the ref to the new snapshot id. Create table transactions that are started by createTable with `stage-create` set to true are committed using this route. Transactions should include all changes to the table, including table initialization, like AddSchemaUpdate and SetCurrentSchemaUpdate. The `assert-create` requirement is used to ensure that the table was not created concurrently.
     *
     * @tags Catalog API
     * @name UpdateTable
     * @summary Commit updates to a table
     * @request POST:/v1/{prefix}/namespaces/{namespace}/tables/{table}
     * @secure
     */
    updateTable: (
      namespace: string,
      table: string,
      data: CommitTableRequest,
      params: RequestParams = {}
    ) =>
      this.request<CommitTableResponse, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables/${table}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Remove a table from the catalog
     *
     * @tags Catalog API
     * @name DropTable
     * @summary Drop a table from the catalog
     * @request DELETE:/v1/{prefix}/namespaces/{namespace}/tables/{table}
     * @secure
     */
    dropTable: (
      namespace: string,
      table: string,
      query?: {
        /**
         * Whether the user requested to purge the underlying table's data and metadata
         * @default false
         */
        purgeRequested?: boolean
      },
      params: RequestParams = {}
    ) =>
      this.request<void, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables/${table}`,
        method: "DELETE",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Check if a table exists within a given namespace. The response does not contain a body.
     *
     * @tags Catalog API
     * @name TableExists
     * @summary Check if a table exists
     * @request HEAD:/v1/{prefix}/namespaces/{namespace}/tables/{table}
     * @secure
     */
    tableExists: (
      namespace: string,
      table: string,
      params: RequestParams = {}
    ) =>
      this.request<void, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables/${table}`,
        method: "HEAD",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Load vended credentials for a table from the catalog.
     *
     * @tags Catalog API
     * @name LoadCredentials
     * @summary Load vended credentials for a table from the catalog
     * @request GET:/v1/{prefix}/namespaces/{namespace}/tables/{table}/credentials
     * @secure
     */
    loadCredentials: (
      namespace: string,
      table: string,
      params: RequestParams = {}
    ) =>
      this.request<LoadCredentialsResponse, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables/${table}/credentials`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Rename a table from one identifier to another. It's valid to move a table across namespaces, but the server implementation is not required to support it.
     *
     * @tags Catalog API
     * @name RenameTable
     * @summary Rename a table from its current name to a new name
     * @request POST:/v1/{prefix}/tables/rename
     * @secure
     */
    renameTable: (data: RenameTableRequest, params: RequestParams = {}) =>
      this.request<void, IcebergErrorResponse | ErrorModel>({
        path: `/v1/tables/rename`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog API
     * @name ReportMetrics
     * @summary Send a metrics report to this endpoint to be processed by the backend
     * @request POST:/v1/{prefix}/namespaces/{namespace}/tables/{table}/metrics
     * @secure
     */
    reportMetrics: (
      namespace: string,
      table: string,
      data: ReportMetricsRequest,
      params: RequestParams = {}
    ) =>
      this.request<void, IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/tables/${table}/metrics`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog API
     * @name CommitTransaction
     * @summary Commit updates to multiple tables in an atomic operation
     * @request POST:/v1/{prefix}/transactions/commit
     * @secure
     */
    commitTransaction: (
      data: CommitTransactionRequest,
      params: RequestParams = {}
    ) =>
      this.request<void, IcebergErrorResponse>({
        path: `/v1/transactions/commit`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Return all view identifiers under this namespace
     *
     * @tags Catalog API
     * @name ListViews
     * @summary List all view identifiers underneath a given namespace
     * @request GET:/v1/{prefix}/namespaces/{namespace}/views
     * @secure
     */
    listViews: (
      namespace: string,
      query?: {
        /**
         * An opaque token that allows clients to make use of pagination for list APIs (e.g. ListTables). Clients may initiate the first paginated request by sending an empty query parameter `pageToken` to the server.
         * Servers that support pagination should identify the `pageToken` parameter and return a `next-page-token` in the response if there are more results available.  After the initial request, the value of `next-page-token` from each response must be used as the `pageToken` parameter value for the next request. The server must return `null` value for the `next-page-token` in the last response.
         * Servers that support pagination must return all results in a single response with the value of `next-page-token` set to `null` if the query parameter `pageToken` is not set in the request.
         * Servers that do not support pagination should ignore the `pageToken` parameter and return all results in a single response. The `next-page-token` must be omitted from the response.
         * Clients must interpret either `null` or missing response value of `next-page-token` as the end of the listing results.
         */
        pageToken?: PageToken
        /**
         * For servers that support pagination, this signals an upper bound of the number of results that a client will receive. For servers that do not support pagination, clients may receive results larger than the indicated `pageSize`.
         * @min 1
         */
        pageSize?: number
      },
      params: RequestParams = {}
    ) =>
      this.request<ListTablesResponse, IcebergErrorResponse | ErrorModel>({
        path: `/v1/namespaces/${namespace}/views`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a view in the given namespace.
     *
     * @tags Catalog API
     * @name CreateView
     * @summary Create a view in the given namespace
     * @request POST:/v1/{prefix}/namespaces/{namespace}/views
     * @secure
     */
    createView: (
      namespace: string,
      data: CreateViewRequest,
      params: RequestParams = {}
    ) =>
      this.request<LoadViewResult, IcebergErrorResponse | ErrorModel>({
        path: `/v1/namespaces/${namespace}/views`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Load a view from the catalog. The response contains both configuration and view metadata. The configuration, if non-empty is used as additional configuration for the view that overrides catalog configuration. The response also contains the view's full metadata, matching the view metadata JSON file. The catalog configuration may contain credentials that should be used for subsequent requests for the view. The configuration key "token" is used to pass an access token to be used as a bearer token for view requests. Otherwise, a token may be passed using a RFC 8693 token type as a configuration key. For example, "urn:ietf:params:oauth:token-type:jwt=<JWT-token>".
     *
     * @tags Catalog API
     * @name LoadView
     * @summary Load a view from the catalog
     * @request GET:/v1/{prefix}/namespaces/{namespace}/views/{view}
     * @secure
     */
    loadView: (namespace: string, view: string, params: RequestParams = {}) =>
      this.request<LoadViewResult, IcebergErrorResponse | ErrorModel>({
        path: `/v1/namespaces/${namespace}/views/${view}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Commit updates to a view.
     *
     * @tags Catalog API
     * @name ReplaceView
     * @summary Replace a view
     * @request POST:/v1/{prefix}/namespaces/{namespace}/views/{view}
     * @secure
     */
    replaceView: (
      namespace: string,
      view: string,
      data: CommitViewRequest,
      params: RequestParams = {}
    ) =>
      this.request<LoadViewResult, IcebergErrorResponse | ErrorModel>({
        path: `/v1/namespaces/${namespace}/views/${view}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Remove a view from the catalog
     *
     * @tags Catalog API
     * @name DropView
     * @summary Drop a view from the catalog
     * @request DELETE:/v1/{prefix}/namespaces/{namespace}/views/{view}
     * @secure
     */
    dropView: (namespace: string, view: string, params: RequestParams = {}) =>
      this.request<void, IcebergErrorResponse | ErrorModel>({
        path: `/v1/namespaces/${namespace}/views/${view}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Check if a view exists within a given namespace. This request does not return a response body.
     *
     * @tags Catalog API
     * @name ViewExists
     * @summary Check if a view exists
     * @request HEAD:/v1/{prefix}/namespaces/{namespace}/views/{view}
     * @secure
     */
    viewExists: (namespace: string, view: string, params: RequestParams = {}) =>
      this.request<void, void | IcebergErrorResponse>({
        path: `/v1/namespaces/${namespace}/views/${view}`,
        method: "HEAD",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Rename a view from one identifier to another. It's valid to move a view across namespaces, but the server implementation is not required to support it.
     *
     * @tags Catalog API
     * @name RenameView
     * @summary Rename a view from its current name to a new name
     * @request POST:/v1/{prefix}/views/rename
     * @secure
     */
    renameView: (data: RenameTableRequest, params: RequestParams = {}) =>
      this.request<void, IcebergErrorResponse | ErrorModel>({
        path: `/v1/views/rename`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  }
}
