import { test as base, expect, Page } from "@playwright/test"
import {
  IcebergTestContainer,
  type IcebergCatalogContainer,
} from "./iceberg-testcontainer"

/* eslint-disable no-empty-pattern */

// Test data constants
export const TEST_CONFIG = {
  // Default admin credentials from docker-compose.yml
  ADMIN_USERNAME: process.env.E2E_ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD || "admin",

  // Test user credentials
  TEST_USER_USERNAME: "testuser",
  TEST_USER_PASSWORD: "testpass123",

  // Database connection (if needed for cleanup)
  DATABASE_URL:
    process.env.E2E_DATABASE_URL ||
    "postgresql://nimtable_user:password@localhost:5432/nimtable",

  // Backend API URL
  API_URL: process.env.E2E_API_URL || "http://localhost:8182",

  // Test timeouts
  TIMEOUT: {
    SHORT: 5000,
    MEDIUM: 15000,
    LONG: 30000,
  },

  // Test catalog configurations
  TEST_CATALOGS: {
    // Simple REST catalog configuration (use environment variable for port)
    getRestCatalog: () => ({
      name: `test-rest-catalog-${Date.now()}`,
      type: "rest",
      uri: process.env.ICEBERG_REST_URL || "http://localhost:8181",
      warehouse: "file:///tmp/warehouse",
      properties: [
        { key: "io-impl", value: "org.apache.iceberg.hadoop.HadoopFileIO" },
      ],
    }),
    // Invalid catalog for error testing
    INVALID: {
      type: "invalid-type",
      uri: "invalid://localhost",
      warehouse: "invalid://warehouse",
      properties: [],
    },
  },
}

// Custom fixtures for common test utilities
interface TestFixtures {
  loginAsAdmin: (page: Page) => Promise<void>
  loginAsUser: (
    page: Page,
    username?: string,
    password?: string
  ) => Promise<void>
  logout: (page: Page) => Promise<void>
  createTestCatalog: (page: Page, catalogName?: string) => Promise<string>
  createTestCatalogWithConfig: (
    page: Page,
    config: TestCatalogConfig
  ) => Promise<TestCatalogResult>
  deleteTestCatalog: (page: Page, catalogName: string) => Promise<void>
  createTestUser: (
    page: Page,
    username?: string,
    password?: string
  ) => Promise<void>
  deleteTestUser: (page: Page, username: string) => Promise<void>
  waitForPageLoad: (page: Page) => Promise<void>
  icebergContainer: IcebergCatalogContainer
}

// Helper types for better testing
export interface TestCatalogConfig {
  name?: string
  type: string
  uri?: string
  warehouse: string
  properties?: Array<{ key: string; value: string }>
}

export interface TestCatalogResult {
  catalogName: string
  success: boolean
  error: string | null
}

export const test = base.extend<TestFixtures>({
  // Iceberg container instance (already started in global setup)
  icebergContainer: async ({ }, use) => {
    // Use environment variable set by global setup
    const restUrl = process.env.ICEBERG_REST_URL
    if (restUrl) {
      await use({
        container: null as any, // We don't need the actual container instance
        restUrl,
        warehouse: "file:///tmp/warehouse"
      })
      return
    }

    // Fallback to static instance method
    const container = IcebergTestContainer.getInstance()
    if (!container) {
      throw new Error("Iceberg container not started. Check global setup.")
    }
    await use(container)
  },

  // Login as admin user
  loginAsAdmin: async ({ icebergContainer: _icebergContainer }, use) => {
    await use(async (page: Page) => {
      await page.goto("/login")

      // Wait for login form to be visible - use ID selector
      await page.waitForSelector('input[id="username"]', {
        timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
      })

      // Fill credentials using ID selectors
      await page.fill('input[id="username"]', TEST_CONFIG.ADMIN_USERNAME)
      await page.fill('input[id="password"]', TEST_CONFIG.ADMIN_PASSWORD)

      // Monitor network requests to see what happens
      page.on("response", async (response) => {
        if (
          response.url().includes("/login") ||
          response.url().includes("/auth")
        ) {
          const _loginResponse = {
            status: response.status(),
            url: response.url(),
          }

          if (response.status() >= 400) {
            try {
              const body = await response.text()
              console.log("❌ Login error response:", body)
            } catch (e) {
              console.log("❌ Could not read error response body", e)
            }
          }
        }
      })

      // Submit login form
      await page.click('button[type="submit"]')

      // Wait a moment for the request to be made
      await page.waitForTimeout(2000)

      // Check for error messages first
      const errorElements = page.locator(
        'text="error", text="invalid", text="failed", .error, [role="alert"]'
      )
      const hasError = (await errorElements.count()) > 0

      if (hasError) {
        const errorText = await errorElements.first().textContent()
        throw new Error(`Login failed with error: ${errorText}`)
      }

      // Check current URL to see if we've been redirected
      const currentUrl = page.url()

      // If we're still on login page, wait a bit more and check again
      if (currentUrl.includes("/login")) {
        try {
          await page.waitForURL(/\/dashboard|\/data|\/(?!login)/, {
            timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
          })
        } catch (error) {
          console.log("❌ Login failed - no redirect occurred", error)

          // Take a screenshot for debugging
          await page.screenshot({
            path: `debug-login-failed-${Date.now()}.png`,
          })

          throw new Error(
            `Login failed - still on login page after ${TEST_CONFIG.TIMEOUT.MEDIUM}ms. Current URL: ${page.url()}`
          )
        }
      }

      // Additional verification - check if we can access authenticated content
      // Try to find some authenticated UI elements
      await page.waitForSelector(
        'nav, .nav, header, .header, [data-testid="user-menu"], .user-menu',
        {
          timeout: TEST_CONFIG.TIMEOUT.SHORT,
        }
      )
    })
  },

  // Login as regular user
  loginAsUser: async ({ }, use) => {
    await use(
      async (
        page: Page,
        username = TEST_CONFIG.TEST_USER_USERNAME,
        password = TEST_CONFIG.TEST_USER_PASSWORD
      ) => {
        await page.goto("/login")
        await page.fill('input[id="username"]', username)
        await page.fill('input[id="password"]', password)
        await page.click('button[type="submit"]')

        // Wait for successful login
        await expect(page).toHaveURL(/\/dashboard|\/data/)
        // Try to find some authenticated UI elements (more flexible selector)
        await page.waitForSelector(
          'nav, .nav, header, .header, [data-testid="user-menu"], .user-menu',
          {
            timeout: TEST_CONFIG.TIMEOUT.SHORT,
          }
        )
      }
    )
  },

  // Logout current user
  logout: async ({ }, use) => {
    await use(async (page: Page) => {
      // Look for user menu or logout button
      try {
        // Try to find and click user menu first
        await page.click(
          '[data-testid="user-menu"], .user-avatar, button:has-text("admin")',
          { timeout: 5000 }
        )
        await page.click(
          'text="Logout", [role="menuitem"]:has-text("Logout")',
          { timeout: 5000 }
        )
      } catch {
        // Alternative logout method via API with POST request
        await page.evaluate(async () => {
          await fetch("/acc-api/auth/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })
        })

        // Navigate to login after API logout
        await page.goto("/login")
      }

      // Verify logout by checking redirect to login page
      await expect(page).toHaveURL(/\/login/)
    })
  },

  // Create a test catalog
  createTestCatalog: async ({ icebergContainer: _icebergContainer }, use) => {
    await use(
      async (page: Page, catalogName = `test-catalog-${Date.now()}`) => {
        await page.goto("/data/catalogs")

        // Wait for page to load
        await page.waitForSelector('button:has-text("Create Catalog")', {
          timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
        })

        await page.click('button:has-text("Create Catalog")')

        // Wait for modal to appear
        await page.waitForSelector('[role="dialog"]', {
          timeout: TEST_CONFIG.TIMEOUT.SHORT,
        })

        // Select custom template to get form inputs
        const templateSelector = page.locator('[role="combobox"]').first()
        await templateSelector.click()
        await page.locator('[role="option"]:has-text("Custom")').click()

        // Wait for form to appear
        await page.waitForSelector("#name", {
          timeout: TEST_CONFIG.TIMEOUT.SHORT,
        })

        // Fill catalog form with REST catalog configuration from container
        const catalogConfig = TEST_CONFIG.TEST_CATALOGS.getRestCatalog()
        await page.fill("#name", catalogName)
        await page.fill("#type", catalogConfig.type)
        await page.fill("#uri", catalogConfig.uri)
        await page.fill("#warehouse", catalogConfig.warehouse)

        // Add required properties if form allows it
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

        // Wait for success message or navigation
        try {
          await page.waitForSelector(
            'text="created", text="success", .success',
            {
              timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
            }
          )
        } catch (_error) {
          // If success message not found, check if we navigated back to catalog list
          await page.waitForURL(/\/data\/catalogs/, {
            timeout: TEST_CONFIG.TIMEOUT.SHORT,
          })
        }

        return catalogName
      }
    )
  },

  // Create a test catalog with specific configuration
  createTestCatalogWithConfig: async ({ icebergContainer: _icebergContainer }, use) => {
    await use(
      async (
        page: Page,
        config: {
          name?: string
          type: string
          uri?: string
          warehouse: string
          properties?: Array<{ key: string; value: string }>
        }
      ) => {
        const catalogName = config.name || `test-catalog-${Date.now()}`

        await page.goto("/data/catalogs")
        await page.click('button:has-text("Create Catalog")')
        await page.waitForSelector('[role="dialog"]')

        // Select custom template
        const templateSelector = page.locator('[role="combobox"]').first()
        await templateSelector.click()
        await page.locator('[role="option"]:has-text("Custom")').click()

        // Wait for form inputs
        await page.waitForSelector("#name")

        // Fill basic info
        await page.fill("#name", catalogName)
        await page.fill("#type", config.type)

        // Fill URI if provided
        if (config.uri) {
          await page.fill("#uri", config.uri)
        }

        // Fill warehouse
        await page.fill("#warehouse", config.warehouse)

        // Add properties
        if (config.properties) {
          for (const prop of config.properties) {
            const addPropertyBtn = page.locator(
              'button:has-text("Add Property")'
            )
            await addPropertyBtn.click()

            // Fill the latest property inputs (they get added to the end)
            const keyInputs = page.locator('input[placeholder="Key"]')
            const valueInputs = page.locator('input[placeholder="Value"]')
            const count = await keyInputs.count()

            await keyInputs.nth(count - 1).fill(prop.key)
            await valueInputs.nth(count - 1).fill(prop.value)
          }
        }

        // Submit
        await page.click('button[type="submit"]:has-text("Create")')

        // Handle potential validation errors gracefully
        try {
          await page.waitForSelector('text="created", text="success"', {
            timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
          })
          return { catalogName, success: true, error: null }
        } catch (_error) {
          // Check for error messages
          const errorElement = page
            .locator(
              'text="error", text="invalid", text="failed", .error, [role="alert"]'
            )
            .first()
          const errorMessage = (await errorElement.isVisible())
            ? await errorElement.textContent()
            : "Unknown error"
          return { catalogName, success: false, error: errorMessage }
        }
      }
    )
  },

  // Delete a test catalog
  deleteTestCatalog: async ({ }, use) => {
    await use(async (page: Page, catalogName: string) => {
      await page.goto("/data/catalogs")

      // Find the catalog card and click delete button
      const catalogCard = page.locator(
        `.card:has-text("${catalogName}"), [class*="card"]:has-text("${catalogName}")`
      )
      await catalogCard
        .locator("button", {
          has: page.locator('[data-lucide="trash-2"], .lucide-trash-2'),
        })
        .click()

      // Confirm deletion
      await page.click('button:has-text("Delete")')

      // Wait for deletion to complete
      await expect(catalogCard).not.toBeVisible({
        timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
      })
    })
  },

  // Create a test user (admin only)
  createTestUser: async ({ }, use) => {
    await use(
      async (
        page: Page,
        username = TEST_CONFIG.TEST_USER_USERNAME,
        password = TEST_CONFIG.TEST_USER_PASSWORD
      ) => {
        await page.goto("/users")
        await page.click('text="Add User", button:has-text("Add")')

        // Fill user form
        await page.fill('input[name="username"]', username)
        await page.fill('input[name="password"]', password)

        // Select role (default to USER)
        await page.click('select[name="role"], [name="role"]')
        await page.click('option[value="USER"], text="User"')

        // Submit form
        await page.click('button[type="submit"], text="Create"')

        // Wait for success
        await page.waitForSelector('text="created", text="success"', {
          timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
        })
      }
    )
  },

  // Delete a test user
  deleteTestUser: async ({ }, use) => {
    await use(async (page: Page, username: string) => {
      await page.goto("/users")

      // Find and delete the user
      const userRow = page.locator(`tr:has-text("${username}")`)
      await userRow
        .locator('button:has-text("Delete"), [aria-label*="delete"]')
        .click()

      // Confirm deletion
      await page.click('button:has-text("Confirm"), button:has-text("Delete")')

      // Wait for deletion
      await expect(userRow).not.toBeVisible({
        timeout: TEST_CONFIG.TIMEOUT.MEDIUM,
      })
    })
  },

  // Wait for page to fully load
  waitForPageLoad: async ({ }, use) => {
    await use(async (page: Page) => {
      try {
        // Try to wait for network idle, but don't fail if it takes too long
        await page.waitForLoadState("domcontentloaded", {
          timeout: TEST_CONFIG.TIMEOUT.SHORT,
        })

        // Try network idle with shorter timeout
        await page
          .waitForLoadState("networkidle", {
            timeout: TEST_CONFIG.TIMEOUT.SHORT,
          })
          .catch(() => {
            // Silent timeout - proceeding anyway
          })

        // Wait for common loading indicators to disappear
        await page
          .waitForFunction(
            () => {
              const loadingSpinners = document.querySelectorAll(
                '.loading, [aria-label*="loading"], .spinner, [data-loading="true"]'
              )
              return loadingSpinners.length === 0
            },
            { timeout: TEST_CONFIG.TIMEOUT.SHORT }
          )
          .catch(() => {
            // Silent timeout - proceeding anyway
          })

        // Small additional wait for UI to settle
        await page.waitForTimeout(500)
      } catch (error) {
        console.log(
          "⚠️ Page load had issues, but continuing:",
          (error as Error).message || error
        )
        // Don't fail the test, just log the issue
      }
    })
  },
})

export { expect } from "@playwright/test"
