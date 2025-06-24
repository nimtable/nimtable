import { FullConfig } from "@playwright/test"
import { IcebergTestContainer } from "./fixtures/iceberg-testcontainer"

async function globalTeardown(_config: FullConfig) {
    console.log("🛑 Starting global test teardown...")

    // Stop Iceberg REST catalog container
    try {
        await IcebergTestContainer.stop()
        console.log("✅ Iceberg REST catalog container stopped successfully")
    } catch (error) {
        console.error("❌ Failed to stop Iceberg container:", error)
        // Don't throw error during teardown
    }
}

export default globalTeardown
