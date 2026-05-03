// src/services/errorTracking.ts
// Captura erros globais da aplicação e registra no Firestore.
// Design: max 20 eventos por sessão (evita custos excessivos),
// agrupamento por fingerprint, contexto rico para diagnóstico.

import { auth, db } from '@/services/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import type { App } from 'vue'
import type { Router } from 'vue-router'

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────

export type ErrorSeverity = 'critical' | 'error' | 'warning'

interface ErrorPayload {
  fingerprint: string
  message: string
  stack: string | null
  severity: ErrorSeverity
  context: 'vue' | 'promise' | 'global'
  url: string
  route: string | null
  userId: string | null
  userEmail: string | null
  meta: Record<string, unknown>
  createdAt: ReturnType<typeof serverTimestamp>
}

// ─────────────────────────────────────────────────────────────
// Rate limiter em memória (por sessão)
// ─────────────────────────────────────────────────────────────

const MAX_ERRORS_PER_SESSION = 20
let errorCount = 0
const seenFingerprints = new Set<string>()

function isRateLimited(fingerprint: string): boolean {
  if (errorCount >= MAX_ERRORS_PER_SESSION) return true
  // Ignora duplicatas exatas dentro da mesma sessão
  if (seenFingerprints.has(fingerprint)) return true
  seenFingerprints.add(fingerprint)
  errorCount++
  return false
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fingerprint(message: string, stack: string | null): string {
  const raw = `${message}::${(stack ?? '').slice(0, 300)}`
  // Hash simples sem crypto (não precisa ser criptográfico)
  let h = 0
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

function collectMeta(): Record<string, unknown> {
  return {
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    online: navigator.onLine,
    colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    appVersion: import.meta.env.VITE_APP_VERSION ?? 'unknown',
  }
}

function classifyError(err: unknown): ErrorSeverity {
  if (err instanceof TypeError || err instanceof ReferenceError) return 'critical'
  const msg = err instanceof Error ? err.message.toLowerCase() : ''
  if (msg.includes('network') || msg.includes('fetch')) return 'error'
  return 'error'
}

// ─────────────────────────────────────────────────────────────
// Writer — única função que toca o Firestore
// ─────────────────────────────────────────────────────────────

let currentRoute: string | null = null

async function writeError(
  err: unknown,
  context: ErrorPayload['context'],
  severity?: ErrorSeverity
): Promise<void> {
  try {
    const error = err instanceof Error ? err : new Error(String(err))
    const fp = fingerprint(error.message, error.stack ?? null)

    if (isRateLimited(fp)) return

    const payload: ErrorPayload = {
      fingerprint: fp,
      message: error.message,
      stack: error.stack ?? null,
      severity: severity ?? classifyError(err),
      context,
      url: window.location.href,
      route: currentRoute,
      userId: auth.currentUser?.uid ?? null,
      userEmail: auth.currentUser?.email ?? null,
      meta: collectMeta(),
      createdAt: serverTimestamp(),
    }

    // Fire-and-forget — nunca bloqueia a UI
    void addDoc(collection(db, 'error_logs'), payload)
  } catch {
    // Silencia erros no próprio rastreador
  }
}

// ─────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────

/**
 * Registra manualmente um erro crítico.
 * Use onde você tiver try/catch e quiser garantir visibilidade.
 *
 * Exemplo:
 *   import { captureError } from '@/services/errorTracking'
 *   captureError(err, 'critical')
 */
export function captureError(err: unknown, severity: ErrorSeverity = 'error'): void {
  void writeError(err, 'global', severity)
}

/**
 * Inicializa os listeners globais e integra com Vue + Router.
 * Chamar uma única vez em main.ts.
 */
export function initErrorTracking(app: App, router?: Router): void {
  // 1. Vue component errors
  app.config.errorHandler = (err, instance, info) => {
    const enriched = err instanceof Error ? err : new Error(String(err))
    enriched.message = `[Vue:${info}] ${enriched.message}`
    void writeError(enriched, 'vue', 'critical')
    console.error('[ErrorTracking] Vue error:', err)
  }

  // 2. Unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    void writeError(event.reason, 'promise')
  })

  // 3. Synchronous JS errors
  window.addEventListener('error', (event) => {
    if (event.error) void writeError(event.error, 'global')
  })

  // 4. Sincroniza a rota atual para contexto nos logs
  if (router) {
    router.afterEach((to) => {
      currentRoute = to.fullPath
    })
  }

  if (import.meta.env.DEV) {
    console.info('[ErrorTracking] Inicializado ✓')
  }
}
