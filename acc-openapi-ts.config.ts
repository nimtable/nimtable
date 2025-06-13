import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "src/lib/acc-api/api.yaml",
  output: {
    format: false,
    path: "src/lib/acc-api/client",
  },
  plugins: ["@hey-api/client-fetch"],
})
