// e2e/auth.spec.ts
// Testa o fluxo completo de autenticação.
// Requer: Firebase Auth Emulator rodando em localhost:9099
//         (iniciado via 'pnpm emulator:start' ou pelo CI)

import { expect, test } from '@playwright/test'
import { DashboardPage } from './pages/dashboard.page'
import { LoginPage } from './pages/login.page'

// Credenciais de teste — o Emulator aceita qualquer email/senha
// sem validação real de email ou domínio
const TEST_EMAIL = 'e2e-test@playwright.local'
const TEST_PASSWORD = 'TestPass123!'

test.describe('Autenticação', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
  })

  // --- Roteamento não autenticado ---

  test('redireciona / para /login quando não autenticado', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/.*#\/login/)
  })

  test('redireciona /dashboard para /login quando não autenticado', async ({ page }) => {
    await page.goto('/#/dashboard')
    await expect(page).toHaveURL(/.*#\/login/)
  })

  // --- Página de login ---

  test('exibe o formulário de login corretamente', async () => {
    await loginPage.goto()

    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.googleButton).toBeVisible()
  })

  // --- Login com email/senha ---

  test('redireciona para /dashboard após login bem-sucedido', async ({ page }) => {
    // Cria o usuário no emulator antes do teste
    await createTestUserInEmulator(TEST_EMAIL, TEST_PASSWORD)

    await loginPage.goto()
    await loginPage.fillAndSubmit(TEST_EMAIL, TEST_PASSWORD)

    await expect(page).toHaveURL(/.*#\/dashboard/, { timeout: 10_000 })
  })

  test('exibe erro para credenciais inválidas', async () => {
    await loginPage.goto()
    await loginPage.fillAndSubmit('nonexistent@test.com', 'wrongpassword')

    // O Firebase Emulator retorna erro real de autenticação
    const error = await loginPage.getErrorText()
    expect(error).toMatch(/não encontrado|inválid/i)
  })

  test('botão de submit fica desabilitado durante o loading', async ({ page }) => {
    await createTestUserInEmulator(TEST_EMAIL, TEST_PASSWORD)
    await loginPage.goto()

    // Preenche sem submeter ainda
    await loginPage.emailInput.fill(TEST_EMAIL)
    await loginPage.passwordInput.fill(TEST_PASSWORD)

    // Clica e verifica o estado de loading
    const responsePromise = page.waitForURL(/.*#\/dashboard/)
    await loginPage.submitButton.click()
    await expect(loginPage.submitButton).toBeDisabled()
    await responsePromise
  })

  // --- Cadastro ---

  test('cria conta nova e redireciona para dashboard', async ({ page }) => {
    const newEmail = `new-${Date.now()}@test.local`

    await loginPage.goto()
    await loginPage.toggleModeButton.click()

    // O submit agora é "Criar conta"
    await loginPage.emailInput.fill(newEmail)
    await loginPage.passwordInput.fill('NewPass123!')
    await loginPage.submitButton.click()

    await expect(page).toHaveURL(/.*#\/dashboard/, { timeout: 10_000 })
  })

  // --- Logout ---

  test('desconecta e volta para /login', async ({ page }) => {
    await createTestUserInEmulator(TEST_EMAIL, TEST_PASSWORD)

    // Login
    await loginPage.goto()
    await loginPage.fillAndSubmit(TEST_EMAIL, TEST_PASSWORD)
    await page.waitForURL(/.*#\/dashboard/)

    // Logout
    await dashboardPage.logout()
    await expect(page).toHaveURL(/.*#\/login/)
  })

  // --- Persistência de sessão ---

  test('mantém a sessão ao recarregar a página', async ({ page }) => {
    await createTestUserInEmulator(TEST_EMAIL, TEST_PASSWORD)

    await loginPage.goto()
    await loginPage.fillAndSubmit(TEST_EMAIL, TEST_PASSWORD)
    await page.waitForURL(/.*#\/dashboard/)

    // Recarrega a página
    await page.reload()

    // Deve continuar no dashboard (Firebase persiste a sessão em IndexedDB)
    await expect(page).toHaveURL(/.*#\/dashboard/, { timeout: 10_000 })
  })
})

// --- Helpers ---

/**
 * Cria um usuário diretamente na API REST do Firebase Auth Emulator.
 * Mais confiável do que criar pela UI do app durante os testes.
 */
async function createTestUserInEmulator(email: string, password: string) {
  try {
    await fetch(
      'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    )
  } catch {
    // Ignora se o usuário já existe (o emulator retorna erro 400)
  }
}
