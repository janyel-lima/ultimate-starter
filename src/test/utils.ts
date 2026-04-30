// src/test/utils.ts
// Utilitários compartilhados entre todos os unit tests.

import type { User } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import { render, type RenderOptions, type RenderResult } from '@testing-library/vue'
import { createPinia } from 'pinia'
import type { Component } from 'vue'
import { createRouter, createWebHashHistory, type Router } from 'vue-router'

// --- Router de teste ---

export function createTestRouter(additionalRoutes: object[] = []): Router {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', redirect: '/login' },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      ...additionalRoutes,
    ],
  })
}

// --- Render com plugins ---

interface RenderWithPluginsOptions extends RenderOptions {
  router?: Router
  initialRoute?: string
  /** Se fornecido, pré-preenche o store de auth (simula usuário logado) */
  authenticatedAs?: Partial<User>
}

export async function renderWithPlugins(
  component: Component,
  options: RenderWithPluginsOptions = {}
): Promise<RenderResult> {
  const { router = createTestRouter(), initialRoute, authenticatedAs, ...renderOptions } = options

  const pinia = createPinia()

  if (initialRoute) {
    await router.push(initialRoute)
    await router.isReady()
  }

  const result = render(component, {
    global: {
      plugins: [pinia, router],
    },
    ...renderOptions,
  })

  // Pré-autentica o store se necessário
  // (simula um usuário já logado sem chamar o Firebase)
  if (authenticatedAs) {
    const authStore = useAuthStore()
    authStore.$patch({
      user: authenticatedAs as User,
      loading: false,
    })
  }

  return result
}

// --- Helpers assíncronos ---

/** Aguarda todas as Promises pendentes na microtask queue */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** Aguarda o Vue atualizar o DOM + todas as Promises */
export async function nextTickAndFlush(): Promise<void> {
  const { nextTick } = await import('vue')
  await nextTick()
  await flushPromises()
}
