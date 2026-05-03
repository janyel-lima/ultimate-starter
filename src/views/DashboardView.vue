<script setup lang="ts">
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { setPrimaryColor } = useTheme()

const sidebarOpen = ref(false)

function initSidebarState() {
    sidebarOpen.value = window.innerWidth >= 1024
}

let resizeTimer: ReturnType<typeof setTimeout>
function handleResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
        if (window.innerWidth < 1024) sidebarOpen.value = false
    }, 150)
}

onMounted(() => { initSidebarState(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { window.removeEventListener('resize', handleResize); clearTimeout(resizeTimer) })

const presetColors = [
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Teal', value: '#14b8a6' },
    { label: 'Sky', value: '#0ea5e9' },
]

async function handleLogout() {
    await authStore.logout()
    router.push({ name: 'login' })
}
</script>

<template>
    <div class="flex h-screen overflow-hidden
         bg-[rgb(var(--bg-base))] dark:bg-[rgb(var(--dark-bg-base))]">

        <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

        <div class="flex flex-col flex-1 overflow-hidden min-w-0 w-full">

            <AppHeader title="Dashboard" :breadcrumb="['Ultimate Starter', 'Dashboard']" :preset-colors="presetColors"
                :notification-count="3" @toggle-sidebar="sidebarOpen = !sidebarOpen" @logout="handleLogout"
                @search="() => { }" />

            <main class="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                <div class="max-w-3xl mx-auto space-y-3 sm:space-y-4">

                    <!-- Welcome card -->
                    <div
                        class="relative overflow-hidden rounded-xl sm:rounded-2xl p-5 sm:p-8
                           bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                           [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_4px_24px_-4px_rgb(var(--color-primary-200)/40%)]
                           dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_4px_24px_-4px_rgb(var(--color-primary-950)/60%)]">

                        <div class="absolute -top-10 -right-10 sm:-top-12 sm:-right-12 w-36 sm:w-48 h-36 sm:h-48 rounded-full opacity-10
                               bg-primary-400 dark:bg-primary-600 blur-3xl pointer-events-none" />

                        <div class="relative text-center">
                            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl mx-auto mb-4 sm:mb-5 flex items-center justify-center
                                 bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/25">
                                <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>

                            <h2 class="text-lg sm:text-xl font-semibold mb-2
                                 text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                Olá, {{ authStore.userDisplayName }}! 👋
                            </h2>
                            <p class="text-xs sm:text-sm max-w-md mx-auto leading-relaxed
                                 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                Seu dashboard está pronto. Use o seletor de cores no header para ver o
                                sistema de temas dinâmico em ação. Toda a paleta é gerada a partir de uma
                                única cor.
                            </p>

                            <div class="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2">
                                <span v-for="color in [
                                    { label: 'Primary', cls: 'bg-primary-500' },
                                    { label: 'Secondary', cls: 'bg-secondary-500' },
                                    { label: 'Tertiary', cls: 'bg-tertiary-500' },
                                ]" :key="color.label"
                                    class="inline-flex items-center px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium text-white shadow-sm"
                                    :class="color.cls">
                                    {{ color.label }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Color presets -->
                    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                        <button v-for="color in presetColors" :key="color.value" class="group flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl transition-all
                                 bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                                 [box-shadow:0_0_0_1px_rgb(var(--color-primary-100))] dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900))]
                                 hover:[box-shadow:0_0_0_2px_rgb(var(--color-primary-300))] dark:hover:[box-shadow:0_0_0_2px_rgb(var(--color-primary-700))]
                                 hover:-translate-y-0.5 active:scale-95" @click="setPrimaryColor(color.value)">
                            <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-sm transition-transform group-hover:scale-110"
                                :style="{ background: color.value }" />
                            <span class="text-[10px] font-medium
                                   text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                {{ color.label }}
                            </span>
                        </button>
                    </div>

                </div>
            </main>

            <AppFooter version="v1.0.0" status="operational" />
        </div>
    </div>
</template>
