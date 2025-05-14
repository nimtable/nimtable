import { defineConfig } from "@hey-api/openapi-ts"
import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "src/lib/api.yaml",
  output: {
    format: false,
    path: "src/lib/client",
  },
  plugins: ["@hey-api/client-fetch"],
})
