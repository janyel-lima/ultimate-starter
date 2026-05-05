<script setup lang="ts">
import AppToast from '@/components/ui/AppToast.vue'
import { useTheme } from '@/composables/useTheme'
import {
    onAppInstalled,
    onInstallPrompt,
    type BeforeInstallPromptEvent,
} from '@/services/pwa'
import { useAuthStore } from '@/stores/auth'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { onMounted, ref, watch } from 'vue'

const { init: initTheme } = useTheme()
const authStore = useAuthStore()

const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
        console.log('[PWA] Service Worker registrado:', r)
    },
})

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const showInstallPrompt = ref(false)
const installDismissed = ref(false)
const updateDismissed = ref(false)
const installing = ref(false)

onMounted(() => {
    initTheme()

    onInstallPrompt((e) => {
        deferredPrompt.value = e
        // Só exibe imediatamente se já estiver autenticado
        if (authStore.isAuthenticated && !installDismissed.value) {
            showInstallPrompt.value = true
        }
    })

    onAppInstalled(() => {
        deferredPrompt.value = null
        showInstallPrompt.value = false
    })
})

// Exibe quando o usuário logar (o evento pode ter disparado antes do login)
watch(() => authStore.isAuthenticated, (authenticated) => {
    if (authenticated && deferredPrompt.value && !installDismissed.value) {
        showInstallPrompt.value = true
    }
    if (!authenticated) {
        showInstallPrompt.value = false
    }
})

async function installApp() {
    if (!deferredPrompt.value) return
    installing.value = true
    try {
        await deferredPrompt.value.prompt()
        const { outcome } = await deferredPrompt.value.userChoice
        if (outcome === 'accepted') {
            showInstallPrompt.value = false
            deferredPrompt.value = null
        }
    } finally {
        installing.value = false
    }
}
</script>

<template>
    <div class="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">

        <!-- PWA: atualização disponível -->
        <Transition name="slide-up">
            <div v-if="needRefresh && !updateDismissed"
                class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
                <div class="relative overflow-hidden rounded-2xl
                            bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                            shadow-[0_0_0_1px_rgb(var(--color-primary-200)),0_8px_32px_-4px_rgb(0_0_0/20%)]
                            dark:shadow-[0_0_0_1px_rgb(var(--color-primary-800)),0_8px_32px_-4px_rgb(0_0_0/50%)]">
                    <div class="h-0.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400
                                bg-[length:200%_100%] animate-shimmer" />
                    <div class="flex items-center gap-3 px-4 py-3.5">
                        <div class="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center
                                    bg-gradient-to-br from-primary-400 to-primary-600
                                    shadow-md shadow-primary-500/30">
                            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-semibold
                                      text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                Atualização disponível
                            </p>
                            <p class="text-[11px]
                                      text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                Nova versão pronta para instalar
                            </p>
                        </div>
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                            <button @click="updateDismissed = true" class="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors
                                       text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                                       hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]">
                                Depois
                            </button>
                            <button @click="updateServiceWorker(true)" class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                                       bg-gradient-to-r from-primary-500 to-primary-600 text-white
                                       shadow-sm shadow-primary-500/30 hover:shadow-primary-500/50
                                       hover:-translate-y-px active:scale-95">
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- PWA: instalar app — só aparece após login -->
        <Transition name="slide-up">
            <div v-if="showInstallPrompt && !installDismissed"
                class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
                <div class="relative overflow-hidden rounded-2xl
                            bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                            shadow-[0_0_0_1px_rgb(var(--color-primary-200)),0_8px_32px_-4px_rgb(0_0_0/20%)]
                            dark:shadow-[0_0_0_1px_rgb(var(--color-primary-800)),0_8px_32px_-4px_rgb(0_0_0/50%)]">

                    <div class="h-0.5 bg-gradient-to-r from-secondary-400 via-primary-500 to-secondary-400
                                bg-[length:200%_100%] animate-shimmer" />

                    <div class="p-4">
                        <div class="flex items-start gap-3 mb-3">
                            <div class="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center
                                        bg-gradient-to-br from-primary-400 to-primary-600
                                        shadow-lg shadow-primary-500/30">
                                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    stroke-width="1.75">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold
                                          text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                    Instalar Ultimate Starter
                                </p>
                                <p class="text-[11px] mt-0.5
                                          text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                    Acesse mais rápido, funciona offline
                                </p>
                            </div>
                            <button @click="installDismissed = true" class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                                       text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                                       hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div class="grid grid-cols-3 gap-2 mb-3.5">
                            <div v-for="feat in [
                                { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Rápido' },
                                { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', label: 'Suporte' },
                                { icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z', label: 'Offline' },
                            ]" :key="feat.label" class="flex flex-col items-center gap-1 p-2 rounded-xl text-center
                                       bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]">
                                <svg class="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor" stroke-width="1.75">
                                    <path stroke-linecap="round" stroke-linejoin="round" :d="feat.icon" />
                                </svg>
                                <span class="text-[10px] font-medium
                                             text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                    {{ feat.label }}
                                </span>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button @click="installDismissed = true"
                                class="flex-1 py-2 rounded-xl text-xs font-medium transition-colors
                                       bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                                       text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                                       hover:bg-[rgb(var(--color-primary-100))] dark:hover:bg-[rgb(var(--color-primary-900))]">
                                Agora não
                            </button>
                            <button @click="installApp" :disabled="installing" class="flex-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all
                                       bg-gradient-to-r from-primary-500 to-primary-600 text-white
                                       shadow-md shadow-primary-500/30 hover:shadow-primary-500/50
                                       hover:-translate-y-0.5 active:scale-95 disabled:opacity-60
                                       disabled:cursor-not-allowed disabled:hover:translate-y-0">
                                <span v-if="installing" class="flex items-center gap-1.5">
                                    <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Instalando…
                                </span>
                                <span v-else class="flex items-center gap-1.5">
                                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        stroke-width="2.5">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Instalar grátis
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

        <RouterView />
        <AppToast />
    </div>
</template>

<style scoped>
.slide-up-enter-active {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-leave-active {
    transition: all 0.2s ease-in;
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
}

@keyframes shimmer {
    0% {
        background-position: 200% center;
    }

    100% {
        background-position: -200% center;
    }
}

.animate-shimmer {
    animation: shimmer 3s linear infinite;
}
</style>
