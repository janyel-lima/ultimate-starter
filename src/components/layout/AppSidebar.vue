<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineProps<{
    open: boolean
}>()

const emit = defineEmits<{
    close: []
}>()

// ─────────────────────────────────────────────────────────────────────────────
// Navegação — fonte única de verdade
// ─────────────────────────────────────────────────────────────────────────────
const navItems = [
    {
        group: 'Principal',
        routeName: 'dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        label: 'Início',
    },
    {
        group: 'Principal',
        routeName: 'analytics',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        label: 'Analytics',
        badge: 'Novo',
    },
    {
        group: 'Principal',
        routeName: 'equipe',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
        label: 'Equipe',
    },
    {
        group: 'Sistema',
        routeName: 'configuracoes',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        label: 'Configurações',
    },
    {
        group: 'Sistema',
        routeName: 'suporte',
        icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        label: 'Suporte',
    },
] as const

function groupItems(items: typeof navItems) {
    const groups: { label: string | null; items: (typeof navItems[number])[] }[] = []
    let currentGroup: { label: string | null; items: (typeof navItems[number])[] } | null = null
    for (const item of items) {
        const groupLabel = item.group ?? null
        if (!currentGroup || currentGroup.label !== groupLabel) {
            currentGroup = { label: groupLabel, items: [] }
            groups.push(currentGroup)
        }
        currentGroup.items.push(item)
    }
    return groups
}

// ─────────────────────────────────────────────────────────────────────────────
// Roteamento e estado ativo
// ─────────────────────────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

function isActive(routeName: string) {
    return route.name === routeName
}

function navigate(routeName: string) {
    const resolved = router.resolve({ name: routeName })
    if (resolved.matched.length > 0) {
        router.push({ name: routeName })
    }
    // Só fecha em mobile — no desktop a sidebar permanece aberta
    if (window.innerWidth < 1024) {
        emit('close')
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// User menu
// ─────────────────────────────────────────────────────────────────────────────
const authStore = useAuthStore()
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

function toggleUserMenu() {
    userMenuOpen.value = !userMenuOpen.value
}

function closeOnOutside(e: MouseEvent) {
    if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
        userMenuOpen.value = false
    }
}

onMounted(() => document.addEventListener('mousedown', closeOnOutside))
onUnmounted(() => document.removeEventListener('mousedown', closeOnOutside))
</script>

<template>
    <!-- Mobile backdrop -->
    <Transition name="fade">
        <div v-if="open" class="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]" @click="emit('close')" />
    </Transition>

    <!-- Sidebar -->
    <aside :class="[
        'flex flex-col flex-shrink-0 z-30 transition-all duration-300 ease-in-out',
        'bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]',
        '[box-shadow:1px_0_6px_-1px_rgb(var(--color-primary-300)/30%)]',
        'dark:[box-shadow:1px_0_6px_-1px_rgb(var(--color-primary-950)/80%)]',
        'fixed inset-y-0 left-0 lg:relative lg:inset-auto',
        open ? 'w-60' : 'w-[60px]',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]">

        <!-- Logo / Brand -->
        <div class="flex items-center h-16 px-3.5 gap-3 overflow-hidden flex-shrink-0">
            <div class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
                 bg-gradient-to-br from-primary-400 to-primary-600 shadow-md shadow-primary-500/30">
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <Transition name="fade">
                <div v-if="open" class="flex-1 min-w-0">
                    <p class="text-sm font-bold truncate
                       text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                        Ultimate Starter
                    </p>
                    <p class="text-[10px] font-medium truncate text-primary-500">
                        Pro workspace
                    </p>
                </div>
            </Transition>
        </div>

        <!-- Gradient divider -->
        <div class="mx-3 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent
                    dark:via-primary-800 flex-shrink-0" />

        <!-- Nav -->
        <nav class="flex-1 px-2 py-3 overflow-y-auto space-y-4">
            <div v-for="group in groupItems(navItems)" :key="group.label ?? 'default'">
                <Transition name="fade">
                    <p v-if="open && group.label" class="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest
                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                        {{ group.label }}
                    </p>
                </Transition>
                <div class="space-y-0.5">
                    <button v-for="item in group.items" :key="item.label" :title="!open ? item.label : undefined"
                        :class="[
                            'relative w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
                            open ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                            isActive(item.routeName)
                                ? 'bg-gradient-to-r from-primary-50 to-primary-50/40 text-primary-700 dark:from-primary-950/70 dark:to-primary-950/20 dark:text-primary-300'
                                : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))] hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]',
                        ]" @click="navigate(item.routeName)">

                        <span v-if="isActive(item.routeName)"
                            class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-500" />

                        <svg :class="[
                            'flex-shrink-0 transition-colors',
                            open ? 'w-[18px] h-[18px]' : 'w-5 h-5',
                            isActive(item.routeName) ? 'text-primary-500' : '',
                        ]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                        </svg>

                        <Transition name="fade">
                            <span v-if="open" class="flex-1 text-left whitespace-nowrap overflow-hidden">
                                {{ item.label }}
                            </span>
                        </Transition>

                        <Transition name="fade">
                            <span v-if="open && 'badge' in item && item.badge" class="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                                       bg-primary-100 dark:bg-primary-950/60
                                       text-primary-700 dark:text-primary-300">
                                {{ item.badge }}
                            </span>
                        </Transition>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Gradient divider -->
        <div class="mx-3 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent
                    dark:via-primary-800 flex-shrink-0" />

        <!-- User section -->
        <div class="p-2 pb-3 flex-shrink-0 relative" ref="userMenuRef">

            <!-- Dropdown menu -->
            <Transition name="menu-up">
                <div v-if="userMenuOpen" class="absolute bottom-full left-2 right-2 mb-2 rounded-xl overflow-hidden z-50
                           bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                           shadow-[0_-4px_24px_-4px_rgb(0_0_0/12%),0_0_0_1px_rgb(var(--color-primary-100))]
                           dark:shadow-[0_-4px_24px_-4px_rgb(0_0_0/40%),0_0_0_1px_rgb(var(--color-primary-900))]">

                    <div class="px-3 py-2.5 border-b
                                border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
                        <p class="text-[10px] font-semibold uppercase tracking-widest
                             text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            Conta
                        </p>
                    </div>

                    <div class="p-1">
                        <button class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                                 transition-colors duration-150 text-left
                                 text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                                 hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]">
                            <svg class="w-4 h-4 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] shrink-0"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span class="flex-1 whitespace-nowrap">Trocar usuário</span>
                        </button>

                        <button class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                                 transition-colors duration-150 text-left
                                 text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                                 hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]">
                            <svg class="w-4 h-4 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] shrink-0"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span class="flex-1 whitespace-nowrap">Adicionar conta</span>
                        </button>

                        <div class="my-1 mx-2 h-px
                                    bg-[rgb(var(--color-primary-100))] dark:bg-[rgb(var(--color-primary-900))]" />

                        <button class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                                 transition-colors duration-150 text-left group
                                 hover:bg-red-50 dark:hover:bg-red-950/40" @click="authStore.logout?.()">
                            <svg class="w-4 h-4 shrink-0 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                                        group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span class="flex-1 whitespace-nowrap
                                         text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                                         group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                Sair
                            </span>
                        </button>
                    </div>
                </div>
            </Transition>

            <!-- Botão de usuário -->
            <button :class="[
                'w-full flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-200 cursor-pointer group',
                userMenuOpen
                    ? 'bg-primary-50 dark:bg-primary-950/50 shadow-[0_0_0_1px_rgb(var(--color-primary-200))] dark:shadow-[0_0_0_1px_rgb(var(--color-primary-800))]'
                    : 'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))] shadow-[0_0_0_1px_rgb(var(--color-primary-100))] dark:shadow-[0_0_0_1px_rgb(var(--color-primary-900))] hover:bg-primary-50/80 dark:hover:bg-primary-950/40 hover:shadow-[0_0_0_1px_rgb(var(--color-primary-200))] dark:hover:shadow-[0_0_0_1px_rgb(var(--color-primary-800))]',
                !open && 'justify-center',
            ]" @click="toggleUserMenu">

                <div class="relative flex-shrink-0">
                    <div :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-all duration-200',
                        'bg-gradient-to-br from-secondary-400 to-secondary-600',
                        userMenuOpen ? 'ring-2 ring-primary-400/60 dark:ring-primary-500/60' : 'group-hover:ring-2 group-hover:ring-primary-300/40',
                    ]">
                        {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
                    </div>
                    <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400
                                 ring-2 ring-[rgb(var(--bg-surface))] dark:ring-[rgb(var(--dark-bg-surface))]
                                 shadow-[0_0_6px_1px_rgb(52_211_153/50%)]" />
                </div>

                <Transition name="fade">
                    <div v-if="open" class="flex-1 min-w-0 text-left">
                        <p class="text-xs font-semibold truncate
                             text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            {{ authStore.userDisplayName }}
                        </p>
                        <p class="text-[10px] truncate
                             text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            {{ authStore.user?.email }}
                        </p>
                    </div>
                </Transition>

                <Transition name="fade">
                    <svg v-if="open" :class="[
                        'w-3.5 h-3.5 flex-shrink-0 transition-all duration-200',
                        userMenuOpen
                            ? 'text-primary-500 rotate-180'
                            : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]'
                    ]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </Transition>
            </button>
        </div>
    </aside>
</template>

<style scoped>
.menu-up-enter-active {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-up-leave-active {
    transition: all 0.15s ease-in;
}

.menu-up-enter-from,
.menu-up-leave-to {
    opacity: 0;
    transform: translateY(6px) scale(0.97);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
