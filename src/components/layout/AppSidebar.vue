<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

interface NavItem {
    icon: string
    label: string
    active: boolean
}

defineProps<{
    open: boolean
    navItems: NavItem[]
}>()

const authStore = useAuthStore()
</script>

<template>
    <aside :class="[
        'flex flex-col border-r transition-all duration-300 ease-in-out flex-shrink-0',
        'bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]',
        'border-[rgb(var(--bg-border))] dark:border-[rgb(var(--dark-bg-border))]',
        open ? 'w-64' : 'w-16',
    ]">
        <!-- Logo -->
        <div class="flex items-center h-16 px-4 border-b
             border-[rgb(var(--bg-border))] dark:border-[rgb(var(--dark-bg-border))]">
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-primary-500 shadow-sm">
                    <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <Transition name="fade">
                    <span v-if="open" class="font-semibold text-sm whitespace-nowrap
                   text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                        Ultimate Starter
                    </span>
                </Transition>
            </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
            <button v-for="item in navItems" :key="item.label" :title="!open ? item.label : undefined" :class="[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                item.active
                    ? 'bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300'
                    : [
                        'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]',
                        'hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]',
                        'hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]',
                    ],
            ]">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
                </svg>
                <Transition name="fade">
                    <span v-if="open" class="whitespace-nowrap overflow-hidden">{{ item.label }}</span>
                </Transition>
            </button>
        </nav>

        <!-- User footer -->
        <div class="p-3 border-t border-[rgb(var(--bg-border))] dark:border-[rgb(var(--dark-bg-border))]">
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                 bg-secondary-100 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-300">
                    {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
                </div>
                <Transition name="fade">
                    <div v-if="open" class="flex-1 min-w-0">
                        <p class="text-xs font-medium truncate
                     text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            {{ authStore.userDisplayName }}
                        </p>
                        <p
                            class="text-xs truncate text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            {{ authStore.user?.email }}
                        </p>
                    </div>
                </Transition>
            </div>
        </div>
    </aside>
</template>
