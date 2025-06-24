import { test, expect } from "../fixtures/test-base"

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start from a logged-out state
    await page.goto("/acc-api/auth/logout")
  })

  test("should login successfully with valid admin credentials", async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin(page)

    // Verify we're on the dashboard or data page
    await expect(page).toHaveURL(/\/(dashboard|data)/)

    // Verify user menu is available
    await expect(
      page.locator('[data-testid="user-menu"], .user-avatar')
    ).toBeVisible()
  })

  test("should show error message with invalid credentials", async ({
    page,
  }) => {
    await page.goto("/login")

    // Try to login with invalid credentials - use id selectors
    await page.fill('input[id="username"]', "invalid-user")
    await page.fill('input[id="password"]', "invalid-pass")
    await page.click('button[type="submit"]')

    // Should stay on login page and show error - improved error detection
    await expect(page).toHaveURL(/\/login/)

    // Wait for any error message to appear (more flexible detection)
    await page.waitForTimeout(2000) // Give time for error to appear

    // Look for various possible error indicators
    const errorSelectors = [
      'text="Authentication Failed"',
      'text="Invalid username or password"',
      'text="Invalid"',
      'text="error"',
      ".error",
      '[role="alert"]',
      ".text-red-200", // From the error styling in login page
      ".border-red-500", // From the error styling
    ]

    let errorFound = false
    for (const selector of errorSelectors) {
      const element = page.locator(selector)
      if ((await element.count()) > 0) {
        errorFound = true
        console.log(`✓ Found error with selector: ${selector}`)
        const text = await element.first().textContent()
        console.log(`Error text: "${text}"`)
        break
      }
    }

    // If no error found, let's see what's on the page
    if (!errorFound) {
      console.log("No error message found. Page content:")
      const pageText = await page.textContent("body")
      console.log(pageText)

      // Take a screenshot for debugging
      await page.screenshot({ path: `debug-no-error-${Date.now()}.png` })
    }

    // At minimum, expect some kind of error to be shown
    expect(errorFound).toBe(true)
  })

  test("should redirect to login when accessing protected route without auth", async ({
    page,
  }) => {
    // Try to access protected route without authentication
    await page.goto("/data/catalogs")

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/)
  })

  test("should logout successfully", async ({ page, loginAsAdmin, logout }) => {
    // Login first
    await loginAsAdmin(page)

    // Logout
    await logout(page)

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/)

    // Try to access protected route again - should be redirected to login
    await page.goto("/data/catalogs")
    await expect(page).toHaveURL(/\/login/)
  })

  test("should handle session timeout", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin(page)

    // Simulate session timeout by clearing cookies
    await page.context().clearCookies()

    // Try to access protected route
    await page.goto("/data/catalogs")

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)
  })

  test("should remember login state across page refreshes", async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin(page)

    // Refresh the page
    await page.reload()

    // Should still be logged in
    await expect(page).toHaveURL(/\/(dashboard|data)/)
    await expect(
      page.locator('[data-testid="user-menu"], .user-avatar')
    ).toBeVisible()
  })

  test("should handle concurrent login attempts", async ({ page, context }) => {
    // Create a second page in the same context
    const page2 = await context.newPage()

    // Login on first page - use id selectors
    await page.goto("/login")
    await page.waitForSelector('input[id="username"]') // Wait for form to load
    await page.fill('input[id="username"]', "admin")
    await page.fill('input[id="password"]', "admin")
    await page.click('button[type="submit"]')

    // Wait for first login to complete
    await page.waitForURL(/\/(dashboard|data)/, { timeout: 15000 })

    // Login on second page with same credentials - use id selectors
    await page2.goto("/login")
    await page2.waitForSelector('input[id="username"]') // Wait for form to load
    await page2.fill('input[id="username"]', "admin")
    await page2.fill('input[id="password"]', "admin")
    await page2.click('button[type="submit"]')

    // Wait for second login to complete
    await page2.waitForURL(/\/(dashboard|data)/, { timeout: 15000 })

    // Both should be logged in successfully
    await expect(page).toHaveURL(/\/(dashboard|data)/)
    await expect(page2).toHaveURL(/\/(dashboard|data)/)

    await page2.close()
  })
})
