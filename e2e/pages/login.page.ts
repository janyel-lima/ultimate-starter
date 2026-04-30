// e2e/pages/login.page.ts
// Page Object Model para a tela de login.
// Encapsula todos os seletores e ações — se o HTML mudar,
// só este arquivo precisa ser atualizado.

import type { Locator, Page } from '@playwright/test'

export class LoginPage {
  readonly page: Page

  // Locators declarados como propriedades — mais fácil de debugar
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly googleButton: Locator
  readonly errorMessage: Locator
  readonly toggleModeButton: Locator
  readonly darkModeButton: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page

    // Preferimos getByRole e getByLabel — são resilientes a mudanças de CSS
    this.emailInput = page.getByLabel('E-mail')
    this.passwordInput = page.getByLabel('Senha')
    this.submitButton = page.getByRole('button', { name: /entrar|criar conta/i })
    this.googleButton = page.getByRole('button', { name: /google/i })
    this.errorMessage = page.locator('[data-testid="auth-error"]')
    this.darkModeButton = page.getByRole('button', { name: /modo/i })
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]')
    // O toggle de modo muda de texto — usamos um seletor estável
    this.toggleModeButton = page.locator('[data-testid="toggle-auth-mode"]')
  }

  async goto() {
    await this.page.goto('/#/login')
    // Aguarda o formulário estar visível antes de prosseguir
    await this.emailInput.waitFor({ state: 'visible' })
  }

  async fillAndSubmit(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async waitForRedirectTo(path: string) {
    await this.page.waitForURL(`**/${path}`)
  }

  async getErrorText(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible' })
    return this.errorMessage.innerText()
  }
}
