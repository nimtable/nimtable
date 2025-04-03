import type { NamespaceTables } from "@/types/data"

// Example data to demonstrate the sidebar without API calls
// Set to [] to test empty catalogs state
export const EXAMPLE_CATALOGS: string[] = ["production", "development", "testing", "analytics"]

// Set specific catalog namespaces to [] to test empty namespaces state
export const EXAMPLE_NAMESPACES: Record<string, NamespaceTables[]> = {
    production: [
        {
            name: "public",
            shortName: "public",
            tables: ["users", "accounts", "transactions", "products"],
            children: [
                {
                    name: "public.analytics",
                    shortName: "analytics",
                    tables: ["user_events", "page_views", "conversions"],
                    children: [],
                },
            ],
        },
        {
            name: "internal",
            shortName: "internal",
            tables: ["employees", "departments", "salaries"],
            children: [],
        },
    ],
    development: [
        {
            name: "public",
            shortName: "public",
            tables: ["users", "accounts", "transactions", "products"],
            children: [],
        },
        {
            name: "test",
            shortName: "test",
            tables: ["test_users", "test_accounts"],
            children: [],
        },
    ],
    testing: [], // Empty namespaces example
    analytics: [
        {
            name: "reports",
            shortName: "reports",
            tables: ["daily_metrics", "weekly_metrics", "monthly_metrics"],
            children: [
                {
                    name: "reports.finance",
                    shortName: "finance",
                    tables: ["revenue", "expenses", "profit_loss"],
                    children: [],
                },
                {
                    name: "reports.marketing",
                    shortName: "marketing",
                    tables: ["campaigns", "ad_performance", "channel_metrics"],
                    children: [],
                },
            ],
        },
        {
            name: "raw_data",
            shortName: "raw_data",
            tables: ["events", "logs", "clicks"],
            children: [],
        },
    ],
}
