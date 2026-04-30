// src/test/setup.ts
// Executado antes de cada arquivo de teste pelo Vitest.
// Configura mocks de APIs do browser que não existem no jsdom.

import '@testing-library/jest-dom'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, vi } from 'vitest'

// --- Mocks de APIs do browser (ausentes no jsdom) ---

// matchMedia: usado pelo useDark() do VueUse
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, // padrão: light mode
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ResizeObserver: usado por algumas libs de layout
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// CSS custom properties: o jsdom não executa CSS, mas precisamos
// que document.documentElement.style.setProperty não quebre
const originalSetProperty = CSSStyleDeclaration.prototype.setProperty
CSSStyleDeclaration.prototype.setProperty = function (
  property: string,
  value: string,
  priority?: string
) {
  originalSetProperty.call(this, property, value, priority ?? '')
}

// --- Configuração global do Vue Test Utils ---

// Stubs globais para RouterLink e RouterView
// evitam erros de "No router provided" em unit tests de componentes
config.global.stubs = {
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: { template: '<div><slot /></div>' },
}

// --- Lifecycle dos testes ---

beforeEach(() => {
  // Cria uma instância fresca de Pinia antes de cada teste.
  // Essencial: evita que estado de um teste vaze para o próximo.
  setActivePinia(createPinia())
})

afterEach(() => {
  // Limpa todos os mocks e spies após cada teste
  vi.clearAllMocks()
  vi.resetAllMocks()

  // Limpa localStorage para evitar interferência entre testes
  localStorage.clear()

  // Reseta classes do document.documentElement (dark mode etc.)
  document.documentElement.className = ''
  document.documentElement.removeAttribute('style')
})
