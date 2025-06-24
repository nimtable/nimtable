import { GenericContainer, StartedTestContainer, Wait } from "testcontainers"
import { readFileSync } from "fs"
import { join } from "path"

export interface IcebergCatalogContainer {
    container: StartedTestContainer
    restUrl: string
    warehouse: string
}

export class IcebergTestContainer {
    private static instance: IcebergCatalogContainer | null = null

    static async start(): Promise<IcebergCatalogContainer> {
        if (this.instance) {
            return this.instance
        }

        console.log("🚀 Starting Iceberg REST catalog container...")

        // Use the official Iceberg REST catalog image with simpler in-memory configuration
        const container = await new GenericContainer("tabulario/iceberg-rest:latest")
            .withExposedPorts(8181)
            .withEnvironment({
                CATALOG_WAREHOUSE: "file:///tmp/warehouse",
                CATALOG_IO__IMPL: "org.apache.iceberg.hadoop.HadoopFileIO",
                CATALOG_JDBC_URL:
                    "jdbc:sqlite:file:/tmp/iceberg_rest?mode=memory&cache=shared",
                CATALOG_JDBC_USER: "user",
                CATALOG_JDBC_PASSWORD: "password",
            })
            .withWaitStrategy(
                Wait.forAll([
                    Wait.forListeningPorts(),
                    Wait.forHttp("/v1/config", 8181).forStatusCode(200),
                ])
            )
            .withStartupTimeout(120_000) // 2 minutes
            .start()

        const restUrl = `http://localhost:${container.getMappedPort(8181)}`
        const warehouse = "file:///tmp/warehouse"

        this.instance = {
            container,
            restUrl,
            warehouse,
        }

        console.log("✅ Iceberg REST catalog started at:", restUrl)
        return this.instance
    }

    static async stop(): Promise<void> {
        if (this.instance) {
            console.log("🛑 Stopping Iceberg REST catalog container...")
            await this.instance.container.stop()
            this.instance = null
        }
    }

    static getInstance(): IcebergCatalogContainer | null {
        return this.instance
    }
}

// Helper function to get test catalog config using the running container
export function getIcebergRestCatalogConfig(catalogName?: string) {
    // Try to read from file first (for cross-process access)
    try {
        const containerInfoPath = join(process.cwd(), 'test-results', 'iceberg-container.json')
        const containerInfo = JSON.parse(readFileSync(containerInfoPath, 'utf-8'))

        if (containerInfo.started) {
            return {
                name: catalogName || `test-rest-catalog-${Date.now()}`,
                type: "rest",
                uri: containerInfo.restUrl,
                warehouse: containerInfo.warehouse,
                properties: [
                    { key: "io-impl", value: "org.apache.iceberg.hadoop.HadoopFileIO" },
                ],
            }
        }
    } catch (error) {
        // Fallback to static instance
    }

    const instance = IcebergTestContainer.getInstance()
    if (!instance) {
        throw new Error(
            "Iceberg container not started. Call IcebergTestContainer.start() first."
        )
    }

    return {
        name: catalogName || `test-rest-catalog-${Date.now()}`,
        type: "rest",
        uri: instance.restUrl,
        warehouse: instance.warehouse,
        properties: [
            { key: "io-impl", value: "org.apache.iceberg.hadoop.HadoopFileIO" },
        ],
    }
}
