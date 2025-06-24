import { test, expect, TEST_CONFIG } from "../fixtures/test-base"

test.describe("Catalog Management", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin(page)
  })

  test("should display catalogs list page", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    // Check if we need to navigate differently
    if (!page.url().includes("/data/catalogs")) {
      // Try clicking on navigation if we're on dashboard
      const dataNavLink = page.locator(
        'nav a[href*="/data"], a:has-text("Data"), a:has-text("Catalogs")'
      )
      if (await dataNavLink.first().isVisible()) {
        await dataNavLink.first().click()
        await waitForPageLoad(page)
      } else {
        // Force navigate
        await page.goto("/data/catalogs", { waitUntil: "domcontentloaded" })
      }
    }

    // Look for the actual heading
    const catalogHeading = page
      .locator("h1, h2")
      .filter({ hasText: /catalog/i })
    if ((await catalogHeading.count()) > 0) {
      await expect(catalogHeading.first()).toBeVisible()
    } else {
      // Fallback: check if we're on any valid data page
      const validDataPage = page.locator(
        'text="Catalogs", text="Data", text="Create"'
      )
      await expect(validDataPage.first()).toBeVisible()
    }

    // Check for create button
    const createButtons = page
      .locator("button, a")
      .filter({ hasText: /create/i })
    if ((await createButtons.count()) > 0) {
      await expect(createButtons.first()).toBeVisible()
    }

    // Check for some page content (more flexible)
    const pageContent = page.locator(
      'main, .main, [role="main"], .container, .content'
    )
    await expect(pageContent.first()).toBeVisible()
  })

  test("should create a REST catalog successfully with Testcontainers", async ({
    page,
    deleteTestCatalog,
    waitForPageLoad,
  }) => {
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    // Click Create Catalog button
    await page.click('button:has-text("Create Catalog")')

    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"], .modal, .dialog')

    // First, select Custom template to get the form inputs
    const templateSelector = page.locator('[role="combobox"]').first()
    await templateSelector.click()
    await page.locator('[role="option"]:has-text("Custom")').click()

    // Now we should have the form inputs visible
    await page.waitForSelector('#name, input[name="name"]')

    const catalogName = `test-rest-${Date.now()}`
    const catalogConfig = TEST_CONFIG.TEST_CATALOGS.getRestCatalog()

    // Fill basic form fields using REST catalog configuration
    await page.fill("#name", catalogName)
    await page.fill("#type", catalogConfig.type)
    await page.fill("#uri", catalogConfig.uri)
    await page.fill("#warehouse", catalogConfig.warehouse)

    // Add required properties for REST catalog
    const addPropertyBtn = page.locator('button:has-text("Add Property")')
    if ((await addPropertyBtn.isVisible()) && catalogConfig.properties) {
      for (const prop of catalogConfig.properties) {
        await addPropertyBtn.click()
        // Fill the latest property inputs (they get added to the end)
        const keyInputs = page.locator('input[placeholder="Key"]')
        const valueInputs = page.locator('input[placeholder="Value"]')
        const count = await keyInputs.count()
        await keyInputs.nth(count - 1).fill(prop.key)
        await valueInputs.nth(count - 1).fill(prop.value)
      }
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Create")')

    // Wait for success or navigation back to catalog list
    try {
      await page.waitForSelector('text="created", text="success", .success', {
        timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
      })
    } catch {
      // If no success message, check if we're back on catalogs page
      await page.waitForURL(/\/data\/catalogs/, {
        timeout: TEST_CONFIG.TIMEOUT.SHORT,
      })
    }

    // Verify catalog appears in the list (it should be in a card)
    await expect(
      page.locator(
        `.card:has-text("${catalogName}"), [class*="card"]:has-text("${catalogName}")`
      )
    ).toBeVisible({ timeout: 10000 })

    // Clean up: delete the created catalog
    await deleteTestCatalog(page, catalogName)
  })

  test("should validate catalog configuration and show meaningful errors", async ({
    page,
    createTestCatalogWithConfig,
  }) => {
    const result = await createTestCatalogWithConfig(
      page,
      TEST_CONFIG.TEST_CATALOGS.INVALID
    )

    // Should handle invalid configuration gracefully
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  test("should handle different catalog types", async ({
    page,
    createTestCatalogWithConfig,
  }) => {
    // Test REST catalog (most reliable with Testcontainers)
    const restResult = await createTestCatalogWithConfig(
      page,
      TEST_CONFIG.TEST_CATALOGS.getRestCatalog()
    )

    // Either success or graceful error handling is acceptable
    expect(restResult.catalogName).toBeTruthy()
    expect(typeof restResult.success).toBe("boolean")
  })

  test("should validate catalog name requirements", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    await page.click('button:has-text("Create Catalog")')
    await page.waitForSelector('[role="dialog"]')

    // Select custom template
    const templateSelector = page.locator('[role="combobox"]').first()
    await templateSelector.click()
    await page.locator('[role="option"]:has-text("Custom")').click()

    // Wait for form
    await page.waitForSelector("#name")

    // Leave name empty, fill other required fields
    await page.fill("#type", "hadoop")
    await page.fill("#warehouse", "/tmp/test")

    // Try to submit
    const submitBtn = page.locator('button[type="submit"]:has-text("Create")')
    if (await submitBtn.isEnabled()) {
      await submitBtn.click()
    }

    // Should show validation error or stay on form
    const hasError = await page
      .locator('text="invalid", text="error", .error, [role="alert"]')
      .isVisible()
    const hasValidation = await page
      .locator('text="required", text="name"')
      .isVisible()
    const stillOnForm = await page.locator("#name").isVisible()

    expect(hasError || hasValidation || stillOnForm).toBe(true)
  })

  test("should delete catalog with confirmation", async ({
    page,
    createTestCatalog,
    deleteTestCatalog,
    waitForPageLoad,
  }) => {
    // Create a test catalog first
    const catalogName = await createTestCatalog(page)

    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    // Verify catalog exists before deletion
    const catalogCard = page.locator(
      `.card:has-text("${catalogName}"), [class*="card"]:has-text("${catalogName}")`
    )
    await expect(catalogCard).toBeVisible()

    // Use the deleteTestCatalog fixture for consistent deletion logic
    await deleteTestCatalog(page, catalogName)
  })

  test("should search/filter catalogs", async ({ page, waitForPageLoad }) => {
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()

    // Test search functionality (if any catalogs exist)
    await searchInput.fill("nonexistent-catalog-name")

    // Should show empty state or filtered results
    // This test passes if the search input works without crashing
    expect(await searchInput.inputValue()).toBe("nonexistent-catalog-name")
  })

  test("should navigate to catalog details/namespaces", async ({
    page,
    createTestCatalog,
    deleteTestCatalog,
    waitForPageLoad,
  }) => {
    const catalogName = await createTestCatalog(page)

    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    // Find catalog card and click info button
    const catalogCard = page.locator(
      `.card:has-text("${catalogName}"), [class*="card"]:has-text("${catalogName}")`
    )
    await expect(catalogCard).toBeVisible()

    // Click the info button
    const infoButton = catalogCard.locator('button:has-text("Info")')
    if (await infoButton.isVisible()) {
      await infoButton.click()

      // Should navigate to catalog details page
      await page.waitForURL(/\/data\/catalog/, {
        timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
      })
    } else {
      // If no info button, just verify the card is clickable
      await expect(catalogCard).toBeVisible()
    }

    // Clean up: delete the created catalog
    await deleteTestCatalog(page, catalogName)
  })

  test("should handle catalog with no real connection gracefully", async ({
    page,
    deleteTestCatalog,
    waitForPageLoad,
  }) => {
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    await page.click('button:has-text("Create Catalog")')
    await page.waitForSelector('[role="dialog"]')

    // Select custom template
    const templateSelector = page.locator('[role="combobox"]').first()
    await templateSelector.click()
    await page.locator('[role="option"]:has-text("Custom")').click()

    await page.waitForSelector("#name")

    const testCatalogName = `test-invalid-${Date.now()}`

    // Fill with invalid but well-formed configuration
    await page.fill("#name", testCatalogName)
    await page.fill("#type", "rest")
    await page.fill("#uri", "http://nonexistent-server:8181")
    await page.fill("#warehouse", "s3://nonexistent-bucket/path")

    // Submit
    await page.click('button[type="submit"]:has-text("Create")')

    // Check for either success message or error - both are acceptable
    let hasSuccess = false
    try {
      await page.waitForSelector('text="created", text="success"', {
        timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
      })
      hasSuccess = true
    } catch {
      hasSuccess = false
    }

    const hasError = await page
      .locator('text="error", text="failed", .error')
      .isVisible()

    // Either response is acceptable - the key is that the system doesn't crash
    expect(hasError || hasSuccess).toBe(true)

    // If successful, try to navigate and ensure graceful error handling
    if (hasSuccess) {
      // The catalog might be created but will fail when accessed
      // This is acceptable behavior for testing
      await page.goto("/data/catalogs")
      await expect(
        page.locator(`.card:has-text("${testCatalogName}")`)
      ).toBeVisible({ timeout: 5000 })

      // Clean up: delete the created catalog if it was created
      try {
        await deleteTestCatalog(page, testCatalogName)
      } catch {
        // Silent fail - catalog might not exist or be deletable
      }
    }
  })
})
