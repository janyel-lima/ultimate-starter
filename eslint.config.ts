// eslint.config.js — ESLint Flat Config (v9+)
// Suporta: TypeScript, Vue 3, Vitest, Playwright
import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginVitest from 'eslint-plugin-vitest';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // --- Ignorados globalmente ---
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', '.devcontainer/**', '*.config.js'],
  },

  // --- Base JS ---
  eslint.configs.recommended,

  // --- TypeScript ---
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Permite any explícito em casos justificados
      '@typescript-eslint/no-explicit-any': 'warn',
      // Imports sem uso são erro — TypeScript já pega, ESLint reforça
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Força async functions a retornar Promise (detecta await acidental)
      '@typescript-eslint/require-await': 'error',
      // Proíbe non-null assertion — use guards
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },

  // --- Vue 3 ---
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      // Composition API com <script setup> — não precisa de component name
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      // Bloco <script setup> obrigatório (não usamos Options API)
      'vue/no-options-api': 'error',
      // Props devem ter tipos TypeScript
      'vue/define-props-declaration': ['error', 'type-based'],
      // Emits devem ser declarados
      'vue/define-emits-declaration': ['error', 'type-based'],
      // Ordem de atributos nos templates
      'vue/attributes-order': ['error', { alphabetical: false }],
    },
  },

  // --- Vitest (apenas arquivos de spec) ---
  {
    files: ['src/**/*.{spec,test}.ts'],
    plugins: { vitest: pluginVitest },
    rules: {
      ...pluginVitest.configs.recommended.rules,
      // Garante que todo teste tenha ao menos uma assertion
      'vitest/expect-expect': 'error',
      // Proíbe testes focados (.only) no CI
      'vitest/no-focused-tests': isCI() ? 'error' : 'warn',
      // Proíbe testes desabilitados sem justificativa
      'vitest/no-disabled-tests': 'warn',
    },
  },

  // --- Playwright (apenas arquivos e2e) ---
  {
    files: ['e2e/**/*.ts'],
    ...pluginPlaywright.configs['flat/recommended'],
    rules: {
      // Proíbe page.waitForTimeout() — use expects nativos
      'playwright/no-wait-for-timeout': 'error',
      // Proíbe seletores CSS frágeis — prefira getByRole, getByLabel
      'playwright/no-raw-locators': 'warn',
    },
  },

  // --- Prettier (desliga regras de estilo que conflitam) ---
  prettierConfig
);

function isCI() {
  return !!process.env.CI;
}
