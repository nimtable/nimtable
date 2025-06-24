import { test, expect } from "../fixtures/test-base"

test.describe("End-to-End Workflows", () => {
  test("complete user journey: login → create catalog → run query → logout", async ({
    page,
    loginAsAdmin,
    logout,
    waitForPageLoad,
  }) => {
    // Step 1: Login
    await loginAsAdmin(page)

    // Step 2: Navigate to catalogs and create a new one
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    const catalogName = `e2e-catalog-${Date.now()}`

    // Create catalog
    await page.click('button:has-text("Create"), a:has-text("Create")')
    await page.fill('input[name="name"], #catalog-name', catalogName)

    // Select first available catalog type
    const typeSelector = page.locator('select[name="type"], [role="combobox"]')
    if (await typeSelector.isVisible()) {
      await typeSelector.click()
      await page.locator('option, [role="option"]').first().click()
    }

    await page.click('button[type="submit"]:has-text("Create")')

    // Wait for creation success
    await expect(
      page.locator('text="created", text="success", .success')
    ).toBeVisible({
      timeout: 15000,
    })

    // Step 3: Navigate to SQL editor and run a query
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Run a simple query
    await page.fill(
      "textarea, .monaco-editor textarea",
      "SELECT 1 as test_column, 'hello' as message"
    )
    await page.click('button:has-text("Run"), button:has-text("Execute")')

    // Verify query results
    await expect(page.locator("table, .results-table")).toBeVisible({
      timeout: 15000,
    })
    await expect(page.locator('text="test_column"')).toBeVisible()
    await expect(page.locator('text="hello"')).toBeVisible()

    // Step 4: Navigate back to catalogs and verify our catalog exists
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)
    await expect(page.locator(`text="${catalogName}"`)).toBeVisible()

    // Step 5: Clean up - delete the catalog
    await page
      .locator(`tr:has-text("${catalogName}") button:has-text("Delete")`)
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')
    await expect(page.locator(`text="${catalogName}"`)).not.toBeVisible({
      timeout: 10000,
    })

    // Step 6: Logout
    await logout(page)
    await expect(page).toHaveURL(/\/login/)
  })

  test("admin workflow: manage users and catalogs", async ({
    page,
    loginAsAdmin,
    waitForPageLoad,
  }) => {
    await loginAsAdmin(page)

    const username = `e2e-user-${Date.now()}`
    const catalogName = `e2e-catalog-${Date.now()}`

    // Step 1: Create a new user
    await page.goto("/users")
    await waitForPageLoad(page)

    await page.click(
      'button:has-text("Add User"), button:has-text("Create User")'
    )
    await page.fill('input[name="username"]', username)
    await page.fill('input[name="password"]', "testpassword123")

    const roleSelector = page.locator('select[name="role"]')
    if (await roleSelector.isVisible()) {
      await roleSelector.selectOption("USER")
    }

    await page.click('button[type="submit"]:has-text("Create")')
    await expect(page.locator('text="created", text="success"')).toBeVisible()

    // Step 2: Create a catalog
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    await page.click('button:has-text("Create"), a:has-text("Create")')
    await page.fill('input[name="name"], #catalog-name', catalogName)

    const typeSelector = page.locator('select[name="type"], [role="combobox"]')
    if (await typeSelector.isVisible()) {
      await typeSelector.click()
      await page.locator('option, [role="option"]').first().click()
    }

    await page.click('button[type="submit"]:has-text("Create")')
    await expect(page.locator('text="created", text="success"')).toBeVisible()

    // Step 3: Verify both resources exist
    await page.goto("/users")
    await expect(page.locator(`text="${username}"`)).toBeVisible()

    await page.goto("/data/catalogs")
    await expect(page.locator(`text="${catalogName}"`)).toBeVisible()

    // Step 4: Clean up
    // Delete catalog
    await page
      .locator(`tr:has-text("${catalogName}") button:has-text("Delete")`)
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')

    // Delete user
    await page.goto("/users")
    await page
      .locator(`tr:has-text("${username}") button:has-text("Delete")`)
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')
  })

  test("data exploration workflow: browse catalogs → namespaces → tables", async ({
    page,
    loginAsAdmin,
    createTestCatalog,
    deleteTestCatalog,
    waitForPageLoad,
  }) => {
    await loginAsAdmin(page)

    // Create a test catalog
    const catalogName = await createTestCatalog(page)

    // Step 1: Start from catalogs page
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    // Verify catalog is listed
    await expect(page.locator(`text="${catalogName}"`)).toBeVisible()

    // Step 2: Navigate to namespaces (if navigation exists)
    const namespacesLink = page.locator(
      `tr:has-text("${catalogName}") a:has-text("View"), tr:has-text("${catalogName}") a:has-text("Namespaces")`
    )

    if (await namespacesLink.isVisible()) {
      await namespacesLink.click()
      await waitForPageLoad(page)

      // Should be on namespaces page
      await expect(page).toHaveURL(/\/data\/namespaces|\/namespace/)

      // Step 3: Look for tables link (if any namespaces exist)
      const tablesLink = page.locator(
        'a:has-text("Tables"), a:has-text("View Tables")'
      )

      if (await tablesLink.isVisible()) {
        await tablesLink.click()
        await waitForPageLoad(page)

        // Should be on tables page
        await expect(page).toHaveURL(/\/data\/tables|\/table/)
      }
    }

    // Clean up
    await deleteTestCatalog(page, catalogName)
  })

  test("error handling workflow: invalid operations and recovery", async ({
    page,
    loginAsAdmin,
    waitForPageLoad,
  }) => {
    await loginAsAdmin(page)

    // Test 1: Try to create catalog with invalid name
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    await page.click('button:has-text("Create"), a:has-text("Create")')
    await page.fill(
      'input[name="name"], #catalog-name',
      "INVALID-NAME-WITH-CAPS"
    )
    await page.click('button[type="submit"]:has-text("Create")')

    // Should show error
    await expect(
      page.locator('text="invalid", text="error", .error')
    ).toBeVisible()

    // Should be able to correct and retry
    await page.fill('input[name="name"], #catalog-name', "validname")

    const typeSelector = page.locator('select[name="type"], [role="combobox"]')
    if (await typeSelector.isVisible()) {
      await typeSelector.click()
      await page.locator('option, [role="option"]').first().click()
    }

    await page.click('button[type="submit"]:has-text("Create")')
    await expect(page.locator('text="created", text="success"')).toBeVisible()

    // Test 2: Try invalid SQL query and recovery
    await page.goto("/data/sql-editor")
    await waitForPageLoad(page)

    // Execute invalid SQL
    await page.fill("textarea, .monaco-editor textarea", "INVALID SQL SYNTAX")
    await page.click('button:has-text("Run"), button:has-text("Execute")')

    // Should show error
    await expect(
      page.locator('text="error", text="syntax", .error')
    ).toBeVisible()

    // Should be able to correct and retry
    await page.fill("textarea, .monaco-editor textarea", "SELECT 1")
    await page.click('button:has-text("Run"), button:has-text("Execute")')

    // Should show results
    await expect(page.locator("table, .results-table")).toBeVisible()

    // Clean up catalog
    await page.goto("/data/catalogs")
    await page
      .locator(`tr:has-text("validname") button:has-text("Delete")`)
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')
  })

  test("concurrent user session workflow", async ({
    page,
    context,
    loginAsAdmin,
  }) => {
    // Login on first page
    await loginAsAdmin(page)

    // Create second page in same context
    const page2 = await context.newPage()
    await page2.goto("/dashboard")

    // Should automatically be logged in on second page
    await expect(page2.locator('[data-testid="user-menu"]')).toBeVisible()

    // Perform actions on both pages simultaneously
    const catalogName1 = `concurrent-catalog-1-${Date.now()}`
    const catalogName2 = `concurrent-catalog-2-${Date.now()}`

    // Create catalog on page 1
    await page.goto("/data/catalogs")
    await page.click('button:has-text("Create"), a:has-text("Create")')
    await page.fill('input[name="name"], #catalog-name', catalogName1)

    // Create catalog on page 2
    await page2.goto("/data/catalogs")
    await page2.click('button:has-text("Create"), a:has-text("Create")')
    await page2.fill('input[name="name"], #catalog-name', catalogName2)

    // Submit both forms
    const typeSelector1 = page.locator('select[name="type"], [role="combobox"]')
    if (await typeSelector1.isVisible()) {
      await typeSelector1.click()
      await page.locator('option, [role="option"]').first().click()
    }
    await page.click('button[type="submit"]:has-text("Create")')

    const typeSelector2 = page2.locator(
      'select[name="type"], [role="combobox"]'
    )
    if (await typeSelector2.isVisible()) {
      await typeSelector2.click()
      await page2.locator('option, [role="option"]').first().click()
    }
    await page2.click('button[type="submit"]:has-text("Create")')

    // Both should succeed
    await expect(page.locator('text="created", text="success"')).toBeVisible()
    await expect(page2.locator('text="created", text="success"')).toBeVisible()

    // Verify both catalogs exist
    await page.goto("/data/catalogs")
    await page2.goto("/data/catalogs")

    await expect(page.locator(`text="${catalogName1}"`)).toBeVisible()
    await expect(page2.locator(`text="${catalogName2}"`)).toBeVisible()

    // Clean up
    await page
      .locator(`tr:has-text("${catalogName1}") button:has-text("Delete")`)
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')

    await page2
      .locator(`tr:has-text("${catalogName2}") button:has-text("Delete")`)
      .click()
    await page2.click('button:has-text("Confirm"), button:has-text("Delete")')

    await page2.close()
  })
})
