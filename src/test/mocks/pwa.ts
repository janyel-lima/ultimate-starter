// src/test/mocks/pwa.ts
// Mock do virtual module 'virtual:pwa-register/vue' gerado pelo vite-plugin-pwa.
// No ambiente de teste (jsdom), o Service Worker não existe.
// Este mock simula a API pública do useRegisterSW() com Refs estáticos.

import { ref } from 'vue'

export function useRegisterSW() {
  return {
    needRefresh: ref(false),
    offlineReady: ref(false),
    updateServiceWorker: vi.fn(() => Promise.resolve()),
    cancelPrompt: vi.fn(() => Promise.resolve()),
  }
}
