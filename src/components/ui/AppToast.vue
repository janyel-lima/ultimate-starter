<script setup lang="ts">
// AppToast.vue — Renderiza a lista de toasts no canto da tela.
// Adicionado ao App.vue para ficar sempre disponível.
import { useToast } from '@/composables/useToast';

const { toasts, dismiss } = useToast()

const icons = {
    success: 'M5 13l4 4L19 7',
    error: 'M6 18L18 6M6 6l12 12',
    warning: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const colors = {
    success: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    info: 'bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200',
}
</script>

<template>
    <Teleport to="body">
        <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite"
            aria-label="Notificações">
            <TransitionGroup name="toast">
                <div v-for="toast in toasts" :key="toast.id" :class="[
                    'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg',
                    'max-w-sm w-full pointer-events-auto',
                    colors[toast.type],
                ]" role="alert">
                    <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" :d="icons[toast.type]" />
                    </svg>
                    <p class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</p>
                    <button class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        :aria-label="`Fechar notificação: ${toast.message}`" @click="dismiss(toast.id)">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.25s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(100%);
}

.toast-move {
    transition: transform 0.25s ease;
}
</style>
