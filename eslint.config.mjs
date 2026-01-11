// @ts-check

import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import unusedImports from "eslint-plugin-unused-imports"
import reactHooks from "eslint-plugin-react-hooks"

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "unused-imports": unusedImports,
      "react-hooks": reactHooks,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Keep rule available so eslint-disable-next-line react-hooks/exhaustive-deps doesn't error.
      // We can enable this later if we want stricter hook correctness checks.
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    ignores: ["**/.next/**", "**/out/**", "**/dist/**", "*.config.*"],
  }
)
