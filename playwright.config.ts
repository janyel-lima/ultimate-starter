// playwright.config.ts
// ------------------------------------------------------------
// O webServer aponta para `pnpm preview` que serve o build
// de produção. Isso garante que os E2E testem o artefato real,
// não o código-fonte via HMR.
//
// Em CI, VITE_USE_FIREBASE_EMULATOR=true é injetado para que
// a app se conecte ao Auth Emulator (porta 9099) ao invés do
// Firebase real.
// ------------------------------------------------------------

import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',

  // Padrão de arquivos de teste E2E
  testMatch: '**/*.spec.ts',

  // Tempo máximo por teste
  timeout: 30_000,

  // Tempo para expect() ser bem-sucedido (assertions assíncronas)
  expect: { timeout: 5_000 },

  // Em CI: 2 retentativas para absorver flakiness de rede/emulator
  retries: isCI ? 2 : 0,

  // Workers: 1 em CI (evita race conditions no emulator), paralelo local
  workers: isCI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // Reporter nativo do GitHub Actions — anota PRs com falhas
    ...(isCI ? [['github'] as ['github']] : []),
  ],

  use: {
    // O preview server sobe na 4173 por padrão
    baseURL: 'http://localhost:4173',

    // Grava trace no primeiro retry para debug
    trace: 'on-first-retry',

    // Screenshots e vídeos apenas em falha
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Locale e timezone consistentes entre máquinas
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Sobe o build de produção antes dos testes
  // VITE_USE_FIREBASE_EMULATOR conecta ao emulator local
  webServer: {
    command: 'VITE_USE_FIREBASE_EMULATOR=true pnpm build && pnpm preview',
    url: 'http://localhost:4173',
    // Reutiliza servidor em dev local (evita rebuild a cada run)
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      VITE_USE_FIREBASE_EMULATOR: 'true',
      VITE_BASE_URL: '/',
    },
  },
});
