// src/composables/useToast.ts
// Sistema de notificações leve baseado em estado reativo global.
// Não depende de libs externas — apenas Vue 3 reactivity.
//
// Uso:
//   const { toast } = useToast()
//   toast.success('Salvo com sucesso!')
//   toast.error('Falha ao salvar.')
//   toast.info('Sincronizando...')
//   toast.warning('Sessão expira em 5 min.')

import { readonly, ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

// Estado global — compartilhado entre todas as instâncias do composable
const toasts = ref<Toast[]>([])
let counter = 0

function add(message: string, type: ToastType, duration = 4000): string {
  const id = `toast-${++counter}`
  toasts.value.push({ id, message, type, duration })

  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }

  return id
}

function dismiss(id: string): void {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index !== -1) toasts.value.splice(index, 1)
}

const toast = {
  success: (message: string, duration?: number) => add(message, 'success', duration),
  error: (message: string, duration?: number) => add(message, 'error', duration),
  warning: (message: string, duration?: number) => add(message, 'warning', duration),
  info: (message: string, duration?: number) => add(message, 'info', duration),
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    toast,
    dismiss,
  }
}
