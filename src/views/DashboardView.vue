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
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        label: 'Início',
        active: true,
    },
    {
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        label: 'Analytics',
        active: false,
    },
    {
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        label: 'Configurações',
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

        <div class="flex flex-col flex-1 overflow-hidden">

            <AppHeader title="Dashboard" :preset-colors="presetColors" @toggle-sidebar="sidebarOpen = !sidebarOpen"
                @logout="handleLogout" />

            <main class="flex-1 overflow-y-auto p-6">
                <div class="max-w-3xl mx-auto">
                    <div class="rounded-2xl border p-8 text-center
                       bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                       border-[rgb(var(--bg-border))] dark:border-[rgb(var(--dark-bg-border))]">
                        <div class="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center
                         bg-primary-50 dark:bg-primary-950/60">
                            <svg class="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold mb-2
                         text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            Olá, {{ authStore.userDisplayName }}! 👋
                        </h2>
                        <p class="text-sm max-w-md mx-auto leading-relaxed
                         text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            Seu dashboard está pronto. Use o seletor de cores no header para ver o sistema de temas
                            dinâmico em ação. Toda a paleta é gerada a partir de uma única cor.
                        </p>

                        <!-- Cores de acento para demonstrar as paletas -->
                        <div class="mt-6 flex flex-wrap justify-center gap-2">
                            <span v-for="color in [
                                { label: 'Primary', cls: 'bg-primary-500' },
                                { label: 'Secondary', cls: 'bg-secondary-500' },
                                { label: 'Tertiary', cls: 'bg-tertiary-500' },
                            ]" :key="color.label"
                                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                                :class="color.cls">
                                {{ color.label }}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            <AppFooter />
        </div>
    </div>
</template>
