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

import { useAuthStore } from '@/stores/auth';
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    // Não entra no login se já está autenticado
    meta: { requiresGuest: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    // Protegida — redireciona para /login se não autenticado
    meta: { requiresAuth: true },
  },
  {
    // Catch-all: rota não encontrada
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// --- Navigation Guard ---
router.beforeEach(async to => {
  const authStore = useAuthStore();

  // Aguarda o Firebase resolver o estado inicial de auth.
  // Sem isso, o guard pode redirecionar antes do Firebase
  // confirmar se há uma sessão ativa.
  if (authStore.loading) {
    await authStore.init();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'dashboard' };
  }
});

export default router;
