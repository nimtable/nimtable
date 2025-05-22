import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { tableSummaries } from "./schema"
import { eq, and, desc } from "drizzle-orm"
// You can specify any property from the node-postgres connection options
export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
    ssl: true,
  },
})

export interface TableSummary {
  catalogName: string
  namespace: string
  tableName: string
  summary: string
  createdAt: string
}

export async function getLatestTableSummary({
  catalogName,
  namespace,
  tableName,
}: {
  catalogName: string
  namespace: string
  tableName: string
}): Promise<TableSummary | null> {
  const res = await db
    .select()
    .from(tableSummaries)
    .where(
      and(
        eq(tableSummaries.catalogName, catalogName),
        eq(tableSummaries.namespace, namespace),
        eq(tableSummaries.tableName, tableName)
      )
    )
    .orderBy(desc(tableSummaries.createdAt))

  if (res.length === 0) {
    return null
  }

  return res[0]
}

export async function saveTableSummary({
  catalogName,
  namespace,
  tableName,
  summary,
  createdBy,
}: {
  catalogName: string
  namespace: string
  tableName: string
  summary: string
  createdBy: "user" | "agent"
}) {
  await db
    .insert(tableSummaries)
    .values({ catalogName, namespace, tableName, summary, createdBy })
}
