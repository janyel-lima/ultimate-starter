// src/router/index.ts
// ------------------------------------------------------------
// DECISÃO DE ARQUITETURA — Hash Mode para GitHub Pages:
//
// O GitHub Pages serve arquivos estáticos. Com History Mode
// (createWebHistory), um refresh em /dashboard retorna 404
// porque o servidor não sabe que é uma SPA.
//
// Soluções possíveis:
//   1. Hash Mode (createWebHashHistory) — mais simples, sem config
//      de servidor, URLs ficam /#/dashboard
//   2. 404.html trick — redireciona 404s via script na página
//
// Escolhemos Hash Mode por ser zero-config e 100% confiável
// no GH Pages. Se o projeto migrar para um servidor com controle
// de rotas (Vercel, Netlify), basta trocar para createWebHistory.
// ------------------------------------------------------------
import { useAuthStore } from '@/stores/auth'
import { watch } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresGuest: true },
  },
  {
    // Layout compartilhado — header, sidebar e footer ficam aqui
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/app/DashboardView.vue'),
      },
      {
        path: 'suporte',
        name: 'suporte',
        component: () => import('@/views/app/SupportView.vue'),
      },
      // adiciona novas rotas autenticadas aqui
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// --- Navigation Guard ---
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => authStore.loading,
        (loading) => {
          if (!loading) {
            stop()
            resolve()
          }
        }
      )
    })
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
