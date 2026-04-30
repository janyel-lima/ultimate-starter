<script setup lang="ts">
// DashboardView.vue — Layout base para o dashboard
// Protegida pelo router guard (meta.requiresAuth: true)
// Contém: Sidebar recolhível + Header + área de conteúdo

import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleDark, primaryColor, setPrimaryColor } = useTheme()

const sidebarOpen = ref(true)
const showColorPicker = ref(false)

// Cores de exemplo para a paleta rápida
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

// Links da sidebar (extensível)
const navItems = [
    { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Início', active: true },
    { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics', active: false },
    { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Configurações', active: false },
]
</script>

<template>
    <div class="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">

        <!-- ========== SIDEBAR ========== -->
        <aside :class="[
            'flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800',
            'transition-all duration-300 ease-in-out flex-shrink-0',
            sidebarOpen ? 'w-64' : 'w-16'
        ]">
            <!-- Sidebar Header -->
            <div class="flex items-center h-16 px-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3 overflow-hidden">
                    <!-- Logo mark -->
                    <div class="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <Transition name="fade">
                        <span v-if="sidebarOpen"
                            class="font-semibold text-slate-900 dark:text-slate-50 text-sm whitespace-nowrap">
                            Ultimate Starter
                        </span>
                    </Transition>
                </div>
            </div>

            <!-- Nav items -->
            <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
                <button v-for="item in navItems" :key="item.label" :class="[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    item.active
                        ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                ]" :title="!sidebarOpen ? item.label : undefined">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
                    </svg>
                    <Transition name="fade">
                        <span v-if="sidebarOpen" class="whitespace-nowrap overflow-hidden">{{ item.label }}</span>
                    </Transition>
                </button>
            </nav>

            <!-- Sidebar Footer — User Info -->
            <div class="p-3 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full
                      flex items-center justify-center text-primary-700 dark:text-primary-300 text-xs font-semibold">
                        {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
                    </div>
                    <Transition name="fade">
                        <div v-if="sidebarOpen" class="flex-1 min-w-0">
                            <p class="text-xs font-medium text-slate-900 dark:text-slate-50 truncate">
                                {{ authStore.userDisplayName }}
                            </p>
                            <p class="text-xs text-slate-400 dark:text-slate-500 truncate">
                                {{ authStore.user?.email }}
                            </p>
                        </div>
                    </Transition>
                </div>
            </div>
        </aside>

        <!-- ========== MAIN AREA ========== -->
        <div class="flex flex-col flex-1 overflow-hidden">

            <!-- HEADER -->
            <header class="flex items-center h-16 px-4 bg-white dark:bg-slate-900 border-b
                     border-slate-100 dark:border-slate-800 gap-4">

                <!-- Toggle sidebar -->
                <button class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800
                 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" @click="sidebarOpen = !sidebarOpen">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <h1 class="text-sm font-semibold text-slate-900 dark:text-slate-50 flex-1">Dashboard</h1>

                <!-- Header actions -->
                <div class="flex items-center gap-2">

                    <!-- Color picker -->
                    <div class="relative">
                        <button class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800
                     hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            title="Personalizar cor primária" @click="showColorPicker = !showColorPicker">
                            <div class="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                :style="{ background: primaryColor }" />
                        </button>

                        <!-- Dropdown de cores -->
                        <Transition name="fade">
                            <div v-if="showColorPicker" v-click-outside="() => showColorPicker = false" class="absolute right-0 top-12 bg-white dark:bg-slate-900 border border-slate-100
                       dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 w-52">
                                <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Cor primária</p>
                                <div class="grid grid-cols-6 gap-2 mb-3">
                                    <button v-for="color in presetColors" :key="color.value"
                                        class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                                        :style="{
                                            background: color.value,
                                            borderColor: primaryColor === color.value ? color.value : 'transparent',
                                            boxShadow: primaryColor === color.value ? `0 0 0 2px white, 0 0 0 4px ${color.value}` : 'none'
                                        }" :title="color.label" @click="setPrimaryColor(color.value)" />
                                </div>
                                <label class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span>Custom</span>
                                    <input type="color" :value="primaryColor"
                                        class="h-7 w-14 rounded cursor-pointer border-0 p-0"
                                        @input="setPrimaryColor(($event.target as HTMLInputElement).value)" />
                                </label>
                            </div>
                        </Transition>
                    </div>

                    <!-- Dark mode toggle -->
                    <button class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800
                   hover:text-slate-800 dark:hover:text-slate-200 transition-colors" @click="toggleDark()">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path v-if="isDark" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    </button>

                    <!-- Logout -->
                    <button class="p-2 rounded-xl text-slate-500 hover:bg-red-50 dark:hover:bg-red-950
                   hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Sair" @click="handleLogout">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            <!-- CONTENT AREA -->
            <main class="flex-1 overflow-y-auto p-6">
                <!-- Placeholder de boas-vindas — substitua pelo conteúdo real -->
                <div class="max-w-3xl mx-auto">
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100
                      dark:border-slate-800 p-8 text-center animate-fade-in">
                        <div class="w-16 h-16 bg-primary-50 dark:bg-primary-950 rounded-2xl mx-auto mb-4
                        flex items-center justify-center">
                            <svg class="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                            Olá, {{ authStore.userDisplayName }}! 👋
                        </h2>
                        <p class="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                            Seu dashboard está pronto. Use o seletor de cores no header para ver o sistema de temas
                            dinâmico em ação. Toda a paleta é gerada a partir de uma única cor.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>
