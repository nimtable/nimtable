import { FullConfig } from "@playwright/test"
import { IcebergTestContainer } from "./fixtures/iceberg-testcontainer"

async function globalSetup(config: FullConfig) {
    console.log("🚀 Starting global test setup...")

    // Start Iceberg REST catalog container once for all tests
    try {
        const container = await IcebergTestContainer.start()
        console.log("✅ Iceberg REST catalog container started successfully")

        // Set environment variable for tests to access
        process.env.ICEBERG_REST_URL = container.restUrl
    } catch (error) {
        console.error("❌ Failed to start Iceberg container:", error)
        throw error
    }
}

export default globalSetup
