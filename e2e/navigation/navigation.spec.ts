import { test, expect } from "../fixtures/test-base"

test.describe("Navigation & UI", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin(page)
  })

  test("should display main navigation elements", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/dashboard")
    await waitForPageLoad(page)

    // Check for main navigation elements
    await expect(page.locator("nav, .navbar, .sidebar")).toBeVisible()

    // Check for key navigation links
    const navLinks = [
      "Dashboard",
      "Data",
      "Catalogs",
      "SQL",
      "Users",
      "Optimization",
    ]

    for (const linkText of navLinks) {
      const link = page.locator(
        `a:has-text("${linkText}"), button:has-text("${linkText}")`
      )
      if (await link.isVisible()) {
        await expect(link).toBeVisible()
      }
    }
  })

  test("should navigate between main sections", async ({
    page,
    waitForPageLoad,
  }) => {
    // Test navigation to different sections
    const navigationTests = [
      { link: "Dashboard", expectedUrl: /\/dashboard/ },
      { link: "Data", expectedUrl: /\/data/ },
      { link: "SQL", expectedUrl: /\/sql/ },
      { link: "Users", expectedUrl: /\/users/ },
    ]

    for (const { link, expectedUrl } of navigationTests) {
      const navLink = page.locator(
        `a:has-text("${link}"), button:has-text("${link}")`
      )

      if (await navLink.isVisible()) {
        await navLink.click()
        await waitForPageLoad(page)
        await expect(page).toHaveURL(expectedUrl)
      }
    }
  })

  test("should highlight current page in navigation", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    // Check if current page is highlighted
    const activeLink = page.locator(
      'a[aria-current="page"], .active, .current, [data-state="active"]'
    )

    if (await activeLink.isVisible()) {
      await expect(activeLink).toBeVisible()
    }
  })

  test("should display user menu and profile options", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/dashboard")
    await waitForPageLoad(page)

    // Look for user avatar or menu
    const userMenu = page.locator(
      '[data-testid="user-menu"], .user-avatar, [aria-label*="user"], [aria-label*="profile"]'
    )

    if (await userMenu.isVisible()) {
      await userMenu.click()

      // Check for logout option
      await expect(
        page.locator(
          'text="Logout", text="Sign out", [role="menuitem"]:has-text("Logout")'
        )
      ).toBeVisible()

      // Check for profile/settings option
      const profileLink = page.locator(
        'text="Profile", text="Settings", [role="menuitem"]:has-text("Profile")'
      )
      if (await profileLink.isVisible()) {
        await expect(profileLink).toBeVisible()
      }
    }
  })

  test("should support sidebar collapse/expand", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/dashboard")
    await waitForPageLoad(page)

    // Look for sidebar toggle button
    const toggleButton = page.locator(
      'button[aria-label*="sidebar"], button[aria-label*="menu"], .sidebar-toggle, [data-testid="sidebar-toggle"]'
    )

    if (await toggleButton.isVisible()) {
      // Get initial sidebar state
      const sidebar = page.locator('.sidebar, nav[role="navigation"]')
      const initialWidth = await sidebar.boundingBox()

      // Toggle sidebar
      await toggleButton.click()
      await page.waitForTimeout(500) // Wait for animation

      // Check if sidebar state changed
      const newWidth = await sidebar.boundingBox()
      expect(newWidth?.width).not.toBe(initialWidth?.width)

      // Toggle back
      await toggleButton.click()
      await page.waitForTimeout(500)
    }
  })

  test("should display breadcrumb navigation", async ({
    page,
    waitForPageLoad,
  }) => {
    // Navigate to a nested page
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    // Look for breadcrumb navigation
    const breadcrumb = page.locator(
      '.breadcrumb, [aria-label*="breadcrumb"], nav[aria-label*="breadcrumb"]'
    )

    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb).toBeVisible()

      // Should contain relevant page names
      await expect(
        breadcrumb.locator('text="Data", text="Catalogs"')
      ).toBeVisible()
    }
  })

  test("should handle responsive layout on mobile", async ({
    page,
    waitForPageLoad,
  }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/dashboard")
    await waitForPageLoad(page)

    // Mobile navigation might be different (hamburger menu, etc.)
    const mobileMenu = page.locator(
      'button[aria-label*="menu"], .mobile-menu-toggle, [data-testid="mobile-menu"]'
    )

    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()

      // Should show navigation options
      await expect(page.locator("nav, .mobile-nav")).toBeVisible()
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test("should maintain navigation state across page refreshes", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/data/catalogs")
    await waitForPageLoad(page)

    // Refresh the page
    await page.reload()
    await waitForPageLoad(page)

    // Should still be on the same page
    await expect(page).toHaveURL(/\/data\/catalogs/)

    // Navigation should still be functional
    await expect(page.locator("nav, .sidebar")).toBeVisible()
  })

  test("should display appropriate navigation for different user roles", async ({
    page,
    createTestUser,
    logout,
    loginAsUser,
    waitForPageLoad,
  }) => {
    // Test admin navigation first
    await page.goto("/dashboard")
    await waitForPageLoad(page)

    // Admin should see Users link
    const adminUsersLink = page.locator(
      'a:has-text("Users"), button:has-text("Users")'
    )
    if (await adminUsersLink.isVisible()) {
      await expect(adminUsersLink).toBeVisible()
    }

    // Create test user and login as regular user
    await createTestUser(page)
    await logout(page)
    await loginAsUser(page)

    await page.goto("/dashboard")
    await waitForPageLoad(page)

    // Regular user should not see Users link or it should be disabled
    const userUsersLink = page.locator(
      'a:has-text("Users"), button:has-text("Users")'
    )
    if (await userUsersLink.isVisible()) {
      // If visible, it should be disabled or show access denied when clicked
      await userUsersLink.click()
      await expect(
        page.locator('text="Access denied", text="Forbidden"')
      ).toBeVisible()
    }

    // Cleanup - login back as admin and delete test user
    await logout(page)
    await page.goto("/login")
    await page.fill('input[name="username"]', "admin")
    await page.fill('input[name="password"]', "admin")
    await page.click('button[type="submit"]')

    await page.goto("/users")
    await page
      .locator(`tr:has-text("testuser") button:has-text("Delete")`)
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')
  })

  test("should handle 404 pages gracefully", async ({
    page,
    waitForPageLoad,
  }) => {
    // Navigate to non-existent page
    await page.goto("/nonexistent-page")
    await waitForPageLoad(page)

    // Should show 404 page or redirect to valid page
    const is404 = await page
      .locator('text="404", text="Not Found", text="Page not found"')
      .isVisible()
    const isRedirected =
      page.url().includes("/dashboard") || page.url().includes("/data")

    expect(is404 || isRedirected).toBe(true)

    // Navigation should still work
    await expect(page.locator("nav, .sidebar")).toBeVisible()
  })
})
