import { test, expect } from "../fixtures/test-base"

test.describe("User Management", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin(page)
  })

  test("admin should access user management page", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/users")
    await waitForPageLoad(page)

    // Verify user management page elements
    await expect(
      page.locator("h1, h2").filter({ hasText: /user/i })
    ).toBeVisible()
    await expect(
      page.locator(
        'button:has-text("Add User"), button:has-text("Create User")'
      )
    ).toBeVisible()
    await expect(
      page.locator('table, .user-list, [data-testid="users-table"]')
    ).toBeVisible()
  })

  test("should create a new user successfully", async ({
    page,
    waitForPageLoad,
  }) => {
    const username = `testuser${Date.now()}`
    const password = "testpassword123"

    await page.goto("/users")
    await waitForPageLoad(page)

    // Click add user button
    await page.click(
      'button:has-text("Add User"), button:has-text("Create User")'
    )

    // Fill user form
    await page.fill('input[name="username"], #username', username)
    await page.fill('input[name="password"], #password', password)

    // Select user role
    const roleSelector = page.locator('select[name="role"], [name="role"]')
    if (await roleSelector.isVisible()) {
      await roleSelector.selectOption("USER")
    }

    // Submit form
    await page.click(
      'button[type="submit"]:has-text("Create"), button:has-text("Save")'
    )

    // Wait for success message
    await expect(
      page.locator('text="created", text="success", .success')
    ).toBeVisible({
      timeout: 10000,
    })

    // Verify user appears in the list
    await page.goto("/users")
    await expect(page.locator(`text="${username}"`)).toBeVisible()

    // Cleanup - delete the test user
    await page
      .locator(
        `tr:has-text("${username}") button:has-text("Delete"), [data-user="${username}"] [aria-label*="delete"]`
      )
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')
  })

  test("should validate user creation form", async ({ page }) => {
    await page.goto("/users")
    await page.click(
      'button:has-text("Add User"), button:has-text("Create User")'
    )

    // Test empty username
    await page.fill('input[name="username"], #username', "")
    await page.fill('input[name="password"], #password', "validpassword")
    await page.click('button[type="submit"]:has-text("Create")')

    // Should show validation error
    await expect(
      page.locator('text="required", text="username", .error')
    ).toBeVisible()

    // Test empty password
    await page.fill('input[name="username"], #username', "validuser")
    await page.fill('input[name="password"], #password', "")
    await page.click('button[type="submit"]:has-text("Create")')

    // Should show validation error
    await expect(
      page.locator('text="required", text="password", .error')
    ).toBeVisible()

    // Test duplicate username (using admin)
    await page.fill('input[name="username"], #username', "admin")
    await page.fill('input[name="password"], #password', "somepassword")
    await page.click('button[type="submit"]:has-text("Create")')

    // Should show duplicate error
    await expect(
      page.locator('text="exists", text="duplicate", .error')
    ).toBeVisible()
  })

  test("should edit user information", async ({ page, createTestUser }) => {
    // Create a test user first
    await createTestUser(page)

    await page.goto("/users")

    // Find the test user and click edit
    const editButton = page.locator(
      `tr:has-text("testuser") button:has-text("Edit"), [data-user="testuser"] [aria-label*="edit"]`
    )

    if (await editButton.isVisible()) {
      await editButton.click()

      // Modify user information
      await page.fill('input[name="username"], #username', "testuser_modified")
      await page.click('button[type="submit"]:has-text("Save")')

      // Verify changes
      await expect(page.locator('text="updated", text="success"')).toBeVisible()
      await expect(page.locator('text="testuser_modified"')).toBeVisible()
    }

    // Cleanup
    await page
      .locator(
        `tr:has-text("testuser") button:has-text("Delete"), tr:has-text("testuser_modified") button:has-text("Delete")`
      )
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')
  })

  test("should delete user with confirmation", async ({
    page,
    createTestUser,
  }) => {
    // Create a test user first
    await createTestUser(page)

    await page.goto("/users")

    // Click delete button
    await page
      .locator(`tr:has-text("testuser") button:has-text("Delete")`)
      .click()

    // Should show confirmation dialog
    await expect(
      page.locator('text="confirm", text="delete", [role="dialog"]')
    ).toBeVisible()

    // Cancel first
    await page.click('button:has-text("Cancel")')
    await expect(page.locator('text="testuser"')).toBeVisible()

    // Actually delete
    await page
      .locator(`tr:has-text("testuser") button:has-text("Delete")`)
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')

    // Verify user is removed
    await expect(page.locator('text="testuser"')).not.toBeVisible({
      timeout: 10000,
    })
  })

  test("should display user roles correctly", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/users")
    await waitForPageLoad(page)

    // Check if admin user is displayed with correct role
    const adminRow = page.locator('tr:has-text("admin")')
    await expect(adminRow).toBeVisible()
    await expect(adminRow.locator('text="ADMIN", text="Admin"')).toBeVisible()
  })

  test("should prevent admin from deleting themselves", async ({
    page,
    waitForPageLoad,
  }) => {
    await page.goto("/users")
    await waitForPageLoad(page)

    // Try to find delete button for admin user
    const adminDeleteButton = page.locator(
      'tr:has-text("admin") button:has-text("Delete")'
    )

    // Should either not exist or be disabled
    if (await adminDeleteButton.isVisible()) {
      await expect(adminDeleteButton).toBeDisabled()
    }
  })

  test("should handle role changes", async ({ page, createTestUser }) => {
    // Create a test user
    await createTestUser(page)

    await page.goto("/users")

    // Find edit button for test user
    const editButton = page.locator(
      `tr:has-text("testuser") button:has-text("Edit")`
    )

    if (await editButton.isVisible()) {
      await editButton.click()

      // Change role to ADMIN
      const roleSelector = page.locator('select[name="role"], [name="role"]')
      if (await roleSelector.isVisible()) {
        await roleSelector.selectOption("ADMIN")
        await page.click('button[type="submit"]:has-text("Save")')

        // Verify role change
        await expect(
          page.locator('text="updated", text="success"')
        ).toBeVisible()

        // Check if role is displayed correctly in the list
        const userRow = page.locator('tr:has-text("testuser")')
        await expect(
          userRow.locator('text="ADMIN", text="Admin"')
        ).toBeVisible()
      }
    }

    // Cleanup
    await page
      .locator(`tr:has-text("testuser") button:has-text("Delete")`)
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')
  })

  test("non-admin user should not access user management", async ({
    page,
    createTestUser,
    logout,
    loginAsUser,
  }) => {
    // Create a test user first
    await createTestUser(page)

    // Logout admin
    await logout(page)

    // Login as regular user
    await loginAsUser(page)

    // Try to access user management page
    await page.goto("/users")

    // Should be redirected or show access denied
    await expect(page).not.toHaveURL("/users")
    // OR
    await expect(
      page.locator(
        'text="Access denied", text="Forbidden", text="Not authorized"'
      )
    ).toBeVisible()

    // Login back as admin to cleanup
    await logout(page)
    await page.goto("/login")
    await page.fill('input[name="username"]', "admin")
    await page.fill('input[name="password"]', "admin")
    await page.click('button[type="submit"]')

    // Delete test user
    await page.goto("/users")
    await page
      .locator(`tr:has-text("testuser") button:has-text("Delete")`)
      .click()
    await page.click('button:has-text("Confirm"), button:has-text("Delete")')
  })
})
