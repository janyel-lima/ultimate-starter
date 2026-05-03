<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

export interface NavItem {
    icon: string
    label: string
    active: boolean
    badge?: string | number
    group?: string
}

defineProps<{
    open: boolean
    navItems: NavItem[]
    appName?: string
}>()

const emit = defineEmits<{ collapse: [] }>()

const authStore = useAuthStore()

// Group nav items by their group label
function groupItems(items: NavItem[]) {
    const groups: { label: string | null; items: NavItem[] }[] = []
    let currentGroup: { label: string | null; items: NavItem[] } | null = null

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
</script>

<template>
    <aside :class="[
        'relative z-40 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0',
        'bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]',
        '[box-shadow:1px_0_6px_-1px_rgb(var(--color-primary-300)/30%)]',
        'dark:[box-shadow:1px_0_6px_-1px_rgb(var(--color-primary-950)/80%)]',
        open ? 'w-60' : 'w-[60px]',
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
                        {{ appName ?? 'Ultimate Starter' }}
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
                <!-- Group label -->
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
                            item.active
                                ? 'bg-gradient-to-r from-primary-50 to-primary-50/40 text-primary-700 dark:from-primary-950/70 dark:to-primary-950/20 dark:text-primary-300'
                                : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))] hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]',
                        ]">
                        <!-- Active accent bar -->
                        <span v-if="item.active"
                            class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-500" />

                        <svg :class="[
                            'flex-shrink-0 transition-colors',
                            open ? 'w-[18px] h-[18px]' : 'w-5 h-5',
                            item.active ? 'text-primary-500' : '',
                        ]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                        </svg>

                        <Transition name="fade">
                            <span v-if="open" class="flex-1 text-left whitespace-nowrap overflow-hidden">
                                {{ item.label }}
                            </span>
                        </Transition>

                        <!-- Badge -->
                        <Transition name="fade">
                            <span v-if="open && item.badge" class="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
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
        <div class="p-2 flex-shrink-0">
            <div :class="[
                'flex items-center gap-3 rounded-xl px-2 py-2 transition-colors cursor-pointer',
                'hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]',
                !open && 'justify-center',
            ]">
                <!-- Avatar with online dot -->
                <div class="relative flex-shrink-0">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                         bg-gradient-to-br from-secondary-400 to-secondary-600
                         text-white shadow-sm">
                        {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
                    </div>
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400
                                 ring-2 ring-[rgb(var(--bg-surface))] dark:ring-[rgb(var(--dark-bg-surface))]" />
                </div>

                <Transition name="fade">
                    <div v-if="open" class="flex-1 min-w-0">
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
                    <svg v-if="open"
                        class="w-3.5 h-3.5 flex-shrink-0 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                </Transition>
            </div>
        </div>
    </aside>
</template>
