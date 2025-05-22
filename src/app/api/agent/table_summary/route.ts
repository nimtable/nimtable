import { getLatestTableSummary } from "@/db/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const table = searchParams.get("table")
  const namespace = searchParams.get("namespace")
  const catalog = searchParams.get("catalog")

  if (!table || !namespace || !catalog) {
    return Response.json(
      { error: "Missing table, namespace, or catalog" },
      { status: 400 }
    )
  }

  const tableSummary = await getLatestTableSummary({
    catalogName: catalog,
    namespace: namespace,
    tableName: table,
  })

  if (!tableSummary) {
    return Response.json({ error: "Table summary not found" }, { status: 404 })
  }

  return Response.json(tableSummary, { status: 200 })
}
