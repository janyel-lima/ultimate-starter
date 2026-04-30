// vitest.config.ts
// Separado do vite.config.ts para clareza —
// o Vite usa plugins diferentes em build vs test (ex: PWA não roda em test).
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    // jsdom simula o browser para testes de componentes Vue
    environment: 'jsdom',

    // Globals: describe, it, expect disponíveis sem import
    globals: true,

    // Roda ANTES de cada arquivo de teste
    setupFiles: ['src/test/setup.ts'],

    // Mock do virtual module do vite-plugin-pwa
    // (não existe no ambiente de teste)
    alias: {
      'virtual:pwa-register/vue': path.resolve(__dirname, 'src/test/mocks/pwa.ts'),
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        'e2e/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/main.ts', // bootstrapping — não testável unitariamente
        'src/router/index.ts', // guards testados via E2E
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
