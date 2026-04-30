// e2e/dashboard.spec.ts
// Testa o layout e funcionalidades do Dashboard.

import { expect, test } from '@playwright/test'
import { DashboardPage } from './pages/dashboard.page'
import { LoginPage } from './pages/login.page'

const TEST_EMAIL = 'dashboard-e2e@playwright.local'
const TEST_PASSWORD = 'TestPass123!'

// Cria o usuário e faz login antes de cada teste deste grupo
test.beforeEach(async ({ page }) => {
  await fetch(
    'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
    }
  ).catch(() => {}) // ignora se já existe

  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.fillAndSubmit(TEST_EMAIL, TEST_PASSWORD)
  await page.waitForURL(/.*#\/dashboard/, { timeout: 10_000 })
})

test.describe('Dashboard', () => {
  test('exibe a mensagem de boas-vindas com o email do usuário', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await expect(dashboard.welcomeMessage).toBeVisible()
  })

  test('sidebar começa aberta', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    expect(await dashboard.isSidebarOpen()).toBe(true)
  })

  test('sidebar recolhe ao clicar no toggle', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.toggleSidebar()
    expect(await dashboard.isSidebarOpen()).toBe(false)
  })

  test('sidebar reabre ao clicar no toggle novamente', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.toggleSidebar() // fecha
    await dashboard.toggleSidebar() // abre
    expect(await dashboard.isSidebarOpen()).toBe(true)
  })

  test('dark mode toggle adiciona a classe "dark" ao html', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.themeToggle.click()

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('dark')
  })

  test('guard protege /dashboard — acesso direto sem auth redireciona', async ({ page }) => {
    // Apaga a sessão limpando o storage e recarrega
    await page.evaluate(() => {
      indexedDB.deleteDatabase('firebaseLocalStorageDb')
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto('/#/dashboard')
    await expect(page).toHaveURL(/.*#\/login/, { timeout: 8_000 })
  })

  test('seletor de cor muda a propriedade CSS primária', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.colorPickerBtn.click()

    // Clica na primeira cor preset (Violet)
    const firstColor = page.locator('[data-testid="color-preset"]').first()
    await firstColor.click()

    // Verifica que a CSS var foi atualizada
    const primary500 = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500')
    )
    expect(primary500.trim()).toMatch(/^\d+ \d+ \d+$/)
  })
})
