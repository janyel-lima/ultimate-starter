<script setup lang="ts">
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { setPrimaryColor } = useTheme()

const sidebarOpen = ref(true)

const presetColors = [
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Teal', value: '#14b8a6' },
    { label: 'Sky', value: '#0ea5e9' },
]

const navItems = [
    {
        group: 'Principal',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        label: 'Início',
        active: true,
    },
    {
        group: 'Principal',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        label: 'Analytics',
        active: false,
        badge: 'Novo',
    },
    {
        group: 'Principal',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
        label: 'Equipe',
        active: false,
    },
    {
        group: 'Sistema',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        label: 'Configurações',
        active: false,
    },
    {
        group: 'Sistema',
        icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        label: 'Suporte',
        active: false,
    },
]

async function handleLogout() {
    await authStore.logout()
    router.push({ name: 'login' })
}
</script>

<template>
    <div class="flex h-screen overflow-hidden
         bg-[rgb(var(--bg-base))] dark:bg-[rgb(var(--dark-bg-base))]">

        <AppSidebar :open="sidebarOpen" :nav-items="navItems" />

        <div class="flex flex-col flex-1 overflow-hidden min-w-0">

            <AppHeader title="Dashboard" :breadcrumb="['Ultimate Starter', 'Dashboard']" :preset-colors="presetColors"
                :notification-count="3" @toggle-sidebar="sidebarOpen = !sidebarOpen" @logout="handleLogout"
                @search="() => { }" />

            <main class="flex-1 overflow-y-auto p-6">
                <div class="max-w-3xl mx-auto space-y-4">

                    <!-- Welcome card -->
                    <div
                        class="relative overflow-hidden rounded-2xl p-8
                           bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                           [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_4px_24px_-4px_rgb(var(--color-primary-200)/40%)]
                           dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_4px_24px_-4px_rgb(var(--color-primary-950)/60%)]">
                        <div class="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10
                               bg-primary-400 dark:bg-primary-600 blur-3xl pointer-events-none" />

                        <div class="relative text-center">
                            <div class="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center
                                 bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/25">
                                <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h2 class="text-xl font-semibold mb-2
                                 text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                Olá, {{ authStore.userDisplayName }}! 👋
                            </h2>
                            <p class="text-sm max-w-md mx-auto leading-relaxed
                                 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                Seu dashboard está pronto. Use o seletor de cores no header para ver o sistema
                                de temas dinâmico em ação. Toda a paleta é gerada a partir de uma única cor.
                            </p>
                            <div class="mt-6 flex flex-wrap justify-center gap-2">
                                <span v-for="color in [
                                    { label: 'Primary', cls: 'bg-primary-500' },
                                    { label: 'Secondary', cls: 'bg-secondary-500' },
                                    { label: 'Tertiary', cls: 'bg-tertiary-500' },
                                ]" :key="color.label"
                                    class="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium text-white shadow-sm"
                                    :class="color.cls">
                                    {{ color.label }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Color presets -->
                    <div class="grid grid-cols-6 gap-3">
                        <button v-for="color in presetColors" :key="color.value" class="group flex flex-col items-center gap-2 p-3 rounded-xl transition-all
                                 bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                                 [box-shadow:0_0_0_1px_rgb(var(--color-primary-100))] dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900))]
                                 hover:[box-shadow:0_0_0_2px_rgb(var(--color-primary-300))] dark:hover:[box-shadow:0_0_0_2px_rgb(var(--color-primary-700))]
                                 hover:-translate-y-0.5" @click="setPrimaryColor(color.value)">
                            <div class="w-7 h-7 rounded-full shadow-sm transition-transform group-hover:scale-110"
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
