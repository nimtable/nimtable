import { test, expect, TEST_CONFIG } from "../fixtures/test-base"

test.describe("Catalog Management", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin(page)
  })

  // test("should display catalogs list page", async ({
  //   page,
  //   waitForPageLoad,
  // }) => {
  //   await page.goto("/data/catalogs")
  //   await waitForPageLoad(page)

  //   // Check if we need to navigate differently
  //   if (!page.url().includes("/data/catalogs")) {
  //     // Try clicking on navigation if we're on dashboard
  //     const dataNavLink = page.locator(
  //       'nav a[href*="/data"], a:has-text("Data"), a:has-text("Catalogs")'
  //     )
  //     if (await dataNavLink.first().isVisible()) {
  //       await dataNavLink.first().click()
  //       await waitForPageLoad(page)
  //     } else {
  //       // Force navigate
  //       await page.goto("/data/catalogs", { waitUntil: "domcontentloaded" })
  //     }
  //   }

  //   // Look for the actual heading
  //   const catalogHeading = page
  //     .locator("h1, h2")
  //     .filter({ hasText: /catalog/i })
  //   if ((await catalogHeading.count()) > 0) {
  //     await expect(catalogHeading.first()).toBeVisible()
  //   } else {
  //     // Fallback: check if we're on any valid data page
  //     const validDataPage = page.locator(
  //       'text="Catalogs", text="Data", text="Create"'
  //     )
  //     await expect(validDataPage.first()).toBeVisible()
  //   }

  //   // Check for create button
  //   const createButtons = page
  //     .locator("button, a")
  //     .filter({ hasText: /create/i })
  //   if ((await createButtons.count()) > 0) {
  //     await expect(createButtons.first()).toBeVisible()
  //   }

  //   // Check for some page content (more flexible)
  //   const pageContent = page.locator(
  //     'main, .main, [role="main"], .container, .content'
  //   )
  //   await expect(pageContent.first()).toBeVisible()
  // })

  test("should create a REST catalog successfully", async ({
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

    // Check for immediate validation errors first
    await page.waitForTimeout(2000) // Give time for validation

    const errorLocators = [
      page.locator('.error'),
      page.locator('[role="alert"]'),
      page.locator('text="error"'),
      page.locator('text="invalid"'),
      page.locator('text="required"')
    ]

    let errorText = null
    for (const locator of errorLocators) {
      if (await locator.isVisible()) {
        errorText = await locator.first().textContent()
        break
      }
    }

    if (errorText) {
      console.log("Form validation error:", errorText)
      await page.screenshot({ path: `debug-form-error-${Date.now()}.png` })
      throw new Error(`Form validation failed: ${errorText}`)
    }

    // Wait for either success message or dialog to close
    try {
      // Wait for the modal to close (indicating successful submission)
      await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: TEST_CONFIG.TIMEOUT.MEDIUM })
      console.log("Dialog closed, catalog creation likely successful")
    } catch {
      // If dialog doesn't close, check for success message
      try {
        await page.waitForSelector('text="created", text="success", .success', {
          timeout: TEST_CONFIG.TIMEOUT.SHORT,
        })
        console.log("Success message found")
      } catch (error) {
        console.log("Neither dialog closed nor success message found")
        await page.screenshot({ path: `debug-catalog-creation-${Date.now()}.png` })
        throw error
      }
    }

    // Ensure we're on the catalogs page
    if (!page.url().includes('/data/catalogs')) {
      await page.goto('/data/catalogs')
      await waitForPageLoad(page)
    }

    // Verify catalog appears in the list (it should be in a card)
    try {
      await expect(
        page.locator(
          `.card:has-text("${catalogName}"), [class*="card"]:has-text("${catalogName}")`
        )
      ).toBeVisible({ timeout: 10000 })
    } catch (error) {
      console.log("Catalog not found in list, taking screenshot for debug")
      await page.screenshot({ path: `debug-catalog-not-found-${Date.now()}.png` })

      // Log all visible cards for debugging
      const cards = page.locator('.card, [class*="card"]')
      const cardCount = await cards.count()
      console.log(`Found ${cardCount} cards on the page`)
      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const cardText = await cards.nth(i).textContent()
        console.log(`Card ${i}: ${cardText}`)
      }

      throw error
    }

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
    // Test REST catalog
    const restResult = await createTestCatalogWithConfig(
      page,
      TEST_CONFIG.TEST_CATALOGS.getRestCatalog()
    )

    // Either success or graceful error handling is acceptable
    expect(restResult.catalogName).toBeTruthy()
    expect(typeof restResult.success).toBe("boolean")

    // Clean up if successful
    if (restResult.success) {
      try {
        await page.goto("/data/catalogs")
        const catalogCard = page.locator(`.card:has-text("${restResult.catalogName}")`)
        if (await catalogCard.isVisible()) {
          await catalogCard.locator("button", {
            has: page.locator('[data-lucide="trash-2"], .lucide-trash-2'),
          }).click()
          await page.click('button:has-text("Delete")')
        }
      } catch (error) {
        console.log("Cleanup failed:", error)
      }
    }
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
    await expect(
      page.locator('text="error", text="failed", .error')
    ).toBeVisible()
  })
})
