// e2e/pages/dashboard.page.ts
import type { Locator, Page } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly sidebar: Locator
  readonly sidebarToggle: Locator
  readonly logoutButton: Locator
  readonly themeToggle: Locator
  readonly colorPickerBtn: Locator
  readonly welcomeMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.locator('aside')
    this.sidebarToggle = page.getByRole('button', { name: /menu|sidebar/i })
    this.logoutButton = page.getByTitle('Sair')
    this.themeToggle = page.getByRole('button', { name: /modo/i })
    this.colorPickerBtn = page.getByTitle('Personalizar cor primária')
    this.welcomeMessage = page.getByText(/olá/i)
  }

  async goto() {
    await this.page.goto('/#/dashboard')
    await this.welcomeMessage.waitFor({ state: 'visible' })
  }

  async logout() {
    await this.logoutButton.click()
    await this.page.waitForURL('**/#/login')
  }

  async toggleSidebar() {
    const sidebarWidth = await this.sidebar.evaluate((el) => el.clientWidth)
    await this.sidebarToggle.click()
    // Aguarda a animação de transição completar
    await this.page.waitForFunction(
      (prevWidth: number) => document.querySelector('aside')?.clientWidth !== prevWidth,
      sidebarWidth
    )
  }

  async isSidebarOpen(): Promise<boolean> {
    return (await this.sidebar.evaluate((el) => el.clientWidth)) > 100
  }
}
