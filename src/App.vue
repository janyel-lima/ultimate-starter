<script setup lang="ts">
// App.vue — Root component
// Responsabilidades:
//   1. Inicializar o tema (aplica cor primária e dark mode)
//   2. Exibir prompt de instalação do PWA
//   3. Renderizar o RouterView

import { useTheme } from '@/composables/useTheme'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { onMounted, ref } from 'vue'

const { init: initTheme, isDark, toggleDark, primaryColor, setPrimaryColor } = useTheme()

// Hook do vite-plugin-pwa para controle manual do prompt de instalação
const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
        console.log('[PWA] Service Worker registrado:', r)
    },
})

// Controle do prompt "Instalar App" nativo do browser
const deferredPrompt = ref<Event | null>(null)
const showInstallPrompt = ref(false)

onMounted(() => {
    // Inicializa cores e dark mode (lê do localStorage)
    initTheme()

    // Captura o evento beforeinstallprompt para exibir o botão customizado
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt.value = e
        showInstallPrompt.value = true
    })
})

async function installApp() {
    if (!deferredPrompt.value) return
    // @ts-expect-error — prompt() é parte da BeforeInstallPromptEvent
    await deferredPrompt.value.prompt()
    showInstallPrompt.value = false
    deferredPrompt.value = null
}
</script>

<template>
    <div class="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
        <!-- PWA: Prompt de atualização disponível -->
        <Transition name="fade">
            <div v-if="needRefresh" class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
               bg-primary-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm">
                <span>Nova versão disponível!</span>
                <button class="font-semibold underline hover:no-underline" @click="updateServiceWorker(true)">
                    Atualizar
                </button>
            </div>
        </Transition>

        <!-- PWA: Botão de instalação do App -->
        <Transition name="fade">
            <button v-if="showInstallPrompt" class="fixed bottom-4 right-4 z-50 flex items-center gap-2
               bg-primary-600 hover:bg-primary-700 text-white
               px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium
               transition-colors duration-200" @click="installApp">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Instalar App
            </button>
        </Transition>

        <!-- Roteamento principal -->
        <RouterView v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
                <component :is="Component" />
            </Transition>
        </RouterView>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(4px);
}
</style>
