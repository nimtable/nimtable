import {
  pgTable,
  index,
  integer,
  varchar,
  timestamp,
  unique,
  bigint,
  jsonb,
  text,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const tableSummaries = pgTable(
  "table_summaries",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "users_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: "9223372036854775807",
      cache: 1,
    }),
    catalogName: varchar("catalog_name", { length: 255 }).notNull(),
    namespace: varchar({ length: 255 }).notNull(),
    tableName: varchar("table_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdBy: varchar("created_by", { length: 255 })
      .$type<"user" | "agent">()
      .notNull(),
    summary: text("summary").notNull(),
  },
  (table) => [
    index("idx_table_summaries_catalog_name_namespace_table").using(
      "btree",
      table.catalogName.asc().nullsLast().op("text_ops"),
      table.namespace.asc().nullsLast().op("text_ops"),
      table.tableName.asc().nullsLast().op("text_ops"),
      table.createdAt.desc()
    ),
  ]
)

export const users = pgTable(
  "users",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "users_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: "9223372036854775807",
      cache: 1,
    }),
    username: varchar({ length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("idx_users_username").using(
      "btree",
      table.username.asc().nullsLast().op("text_ops")
    ),
    unique("users_username_key").on(table.username),
  ]
)

export const catalogs = pgTable(
  "catalogs",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "catalogs_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: "9223372036854775807",
      cache: 1,
    }),
    name: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).notNull(),
    uri: varchar({ length: 1024 }),
    warehouse: varchar({ length: 1024 }),
    properties: jsonb(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("idx_catalogs_name").using(
      "btree",
      table.name.asc().nullsLast().op("text_ops")
    ),
    unique("catalogs_name_key").on(table.name),
  ]
)

export const dataDistributions = pgTable(
  "data_distributions",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({
      name: "data_distributions_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: "9223372036854775807",
      cache: 1,
    }),
    snapshotId: varchar("snapshot_id", { length: 255 }).notNull(),
    catalogName: varchar("catalog_name", { length: 255 }).notNull(),
    namespace: varchar({ length: 255 }).notNull(),
    tableName: varchar("table_name", { length: 255 }).notNull(),
    dataFileCount: integer("data_file_count").notNull(),
    positionDeleteFileCount: integer("position_delete_file_count").notNull(),
    eqDeleteFileCount: integer("eq_delete_file_count").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    dataFileSizeInBytes: bigint("data_file_size_in_bytes", {
      mode: "number",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    positionDeleteFileSizeInBytes: bigint(
      "position_delete_file_size_in_bytes",
      { mode: "number" }
    ).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    eqDeleteFileSizeInBytes: bigint("eq_delete_file_size_in_bytes", {
      mode: "number",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    dataFileRecordCount: bigint("data_file_record_count", {
      mode: "number",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    positionDeleteFileRecordCount: bigint("position_delete_file_record_count", {
      mode: "number",
    }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    eqDeleteFileRecordCount: bigint("eq_delete_file_record_count", {
      mode: "number",
    }).notNull(),
    ranges: jsonb(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("idx_data_distributions_snapshot").using(
      "btree",
      table.snapshotId.asc().nullsLast().op("text_ops"),
      table.catalogName.asc().nullsLast().op("text_ops"),
      table.namespace.asc().nullsLast().op("text_ops"),
      table.tableName.asc().nullsLast().op("text_ops")
    ),
    unique(
      "data_distributions_snapshot_id_catalog_name_namespace_table_key"
    ).on(table.snapshotId, table.catalogName, table.namespace, table.tableName),
  ]
)
