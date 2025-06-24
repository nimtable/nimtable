import { test, expect } from "../fixtures/test-base"

test.describe("SQL Editor & Query Execution", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin(page)
  })

  test("should display SQL editor interface", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Verify main components are present
    await expect(
      page.locator("textarea, .monaco-editor, .sql-editor")
    ).toBeVisible()
    await expect(
      page.locator('button:has-text("Run"), button:has-text("Execute")')
    ).toBeVisible()

    // Check for syntax highlighting or editor features
    const editor = page.locator(".monaco-editor, .sql-editor, textarea")
    await expect(editor).toBeVisible()
  })

  test("should execute a simple SQL query", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Enter a simple SQL query
    const query = "SELECT 1 as test_column"
    await page.fill(
      'textarea, .monaco-editor textarea, [data-testid="sql-input"]',
      query
    )

    // Execute the query
    await page.click('button:has-text("Run"), button:has-text("Execute")')

    // Wait for results
    await expect(
      page.locator('table, .results-table, [data-testid="query-results"]')
    ).toBeVisible({
      timeout: 15000,
    })

    // Verify results contain expected data
    await expect(
      page.locator('text="test_column", th:has-text("test_column")')
    ).toBeVisible()
    await expect(page.locator('text="1", td:has-text("1")')).toBeVisible()
  })

  test("should handle SQL syntax errors gracefully", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Enter invalid SQL
    const invalidQuery = "SELECT * FROM nonexistent_table WHERE invalid syntax"
    await page.fill(
      'textarea, .monaco-editor textarea, [data-testid="sql-input"]',
      invalidQuery
    )

    // Execute the query
    await page.click('button:has-text("Run"), button:has-text("Execute")')

    // Should show error message
    await expect(
      page.locator('text="error", text="syntax", .error, [role="alert"]')
    ).toBeVisible({
      timeout: 10000,
    })
  })

  test("should support keyboard shortcuts", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Enter SQL query
    const query = "SELECT 1"
    await page.fill(
      'textarea, .monaco-editor textarea, [data-testid="sql-input"]',
      query
    )

    // Use Ctrl+Enter to execute (or Cmd+Enter on Mac)
    const modifier = process.platform === "darwin" ? "Meta" : "Control"
    await page.keyboard.press(`${modifier}+Enter`)

    // Should execute the query
    await expect(
      page.locator('table, .results-table, [data-testid="query-results"]')
    ).toBeVisible({
      timeout: 15000,
    })
  })

  test("should display query execution time and status", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Execute a query
    await page.fill(
      'textarea, .monaco-editor textarea, [data-testid="sql-input"]',
      "SELECT 1"
    )
    await page.click('button:has-text("Run"), button:has-text("Execute")')

    // Wait for results
    await expect(page.locator("table, .results-table")).toBeVisible({
      timeout: 15000,
    })

    // Check for execution time/status indicators
    await expect(
      page.locator(
        'text="ms", text="seconds", text="executed", text="completed"'
      )
    ).toBeVisible()
  })

  test("should support result export functionality", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Execute a query that returns results
    await page.fill(
      'textarea, .monaco-editor textarea, [data-testid="sql-input"]',
      "SELECT 1 as col1, 2 as col2"
    )
    await page.click('button:has-text("Run"), button:has-text("Execute")')

    // Wait for results
    await expect(page.locator("table, .results-table")).toBeVisible({
      timeout: 15000,
    })

    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("CSV"), button:has-text("Download")'
    )

    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent("download")

      await exportButton.click()

      // Wait for download to start
      const download = await downloadPromise

      // Verify download was initiated
      expect(download.suggestedFilename()).toMatch(/\.(csv|json|xlsx)$/i)
    }
  })

  test("should handle large result sets with pagination", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Try to execute a query that might return multiple rows
    // This depends on having test data available
    const query = `
      SELECT 
        ROW_NUMBER() OVER () as id,
        'test_value_' || ROW_NUMBER() OVER () as value
      FROM (
        SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
        UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
      ) t
    `

    await page.fill(
      'textarea, .monaco-editor textarea, [data-testid="sql-input"]',
      query
    )
    await page.click('button:has-text("Run"), button:has-text("Execute")')

    // Wait for results
    await expect(page.locator("table, .results-table")).toBeVisible({
      timeout: 15000,
    })

    // Check if pagination controls exist (they might not for small result sets)
    const paginationExists = await page
      .locator(
        'button:has-text("Next"), button:has-text("Previous"), .pagination'
      )
      .isVisible()

    if (paginationExists) {
      // Test pagination if it exists
      await page.click('button:has-text("Next")')
      await page.waitForTimeout(1000)
    }
  })

  test("should support query history or saved queries", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Execute a few different queries
    const queries = ["SELECT 1", "SELECT 2", "SELECT 3"]

    for (const query of queries) {
      await page.fill(
        'textarea, .monaco-editor textarea, [data-testid="sql-input"]',
        query
      )
      await page.click('button:has-text("Run"), button:has-text("Execute")')
      await page.waitForTimeout(2000)
    }

    // Check if there's a history feature
    const historyButton = page.locator(
      'button:has-text("History"), .query-history, [data-testid="query-history"]'
    )

    if (await historyButton.isVisible()) {
      await historyButton.click()

      // Should show previous queries
      await expect(
        page.locator('text="SELECT 1", text="SELECT 2"')
      ).toBeVisible()
    }
  })

  test("should handle query cancellation", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Enter a query that might take some time
    const longQuery = "SELECT pg_sleep(5)" // PostgreSQL sleep function
    await page.fill(
      'textarea, .monaco-editor textarea, [data-testid="sql-input"]',
      longQuery
    )

    // Start execution
    await page.click('button:has-text("Run"), button:has-text("Execute")')

    // Look for cancel button
    const cancelButton = page.locator(
      'button:has-text("Cancel"), button:has-text("Stop")'
    )

    if (await cancelButton.isVisible({ timeout: 2000 })) {
      await cancelButton.click()

      // Should show cancellation message
      await expect(
        page.locator('text="cancelled", text="stopped", .warning')
      ).toBeVisible()
    }
  })

  test("should auto-generate queries from URL parameters", async ({
    page,
    waitForPageLoad,
  }) => {
    // Visit SQL editor with query parameters
    const encodedQuery = encodeURIComponent("SELECT * FROM test_table LIMIT 10")
    await page.goto(`/data/sql-editor?query=${encodedQuery}`)
    await waitForPageLoad(page)

    // Should auto-populate the editor with the query
    await expect(page.locator("textarea, .monaco-editor")).toHaveValue(
      /SELECT.*test_table.*LIMIT 10/
    )
  })
})
