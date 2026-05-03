<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import { ref } from 'vue';

interface PresetColor {
    label: string
    value: string
}

defineProps<{
    title?: string
    breadcrumb?: string[]
    presetColors: PresetColor[]
    notificationCount?: number
}>()

const emit = defineEmits<{
    toggleSidebar: []
    logout: []
    search: []
}>()

const { isDark, toggleDark, primaryColor, setPrimaryColor } = useTheme()
const showColorPicker = ref(false)
</script>

<template>
    <header class="relative z-30 flex items-center h-16 px-4 gap-3
           bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
           [box-shadow:0_4px_20px_-4px_rgb(var(--color-primary-300)/35%)]
           dark:[box-shadow:0_4px_20px_-4px_rgb(var(--color-primary-950)/70%)]">

        <!-- Sidebar toggle -->
        <button class="flex-shrink-0 p-2 rounded-xl transition-colors
             text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
             hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
             hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]"
            @click="emit('toggleSidebar')">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <!-- Breadcrumb / Title -->
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
            <template v-if="breadcrumb && breadcrumb.length > 1">
                <span v-for="(crumb, i) in breadcrumb" :key="i" class="flex items-center gap-1.5">
                    <span :class="[
                        'text-sm truncate',
                        i === breadcrumb.length - 1
                            ? 'font-semibold text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]'
                            : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))] cursor-pointer transition-colors'
                    ]">{{ crumb }}</span>
                    <svg v-if="i < breadcrumb.length - 1"
                        class="w-3.5 h-3.5 flex-shrink-0 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </template>
            <h1 v-else class="text-sm font-semibold truncate
                 text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                {{ title ?? 'Dashboard' }}
            </h1>
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-1 flex-shrink-0">

            <!-- Search trigger -->
            <button
                class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-colors
                 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                 bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                 hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]
                 [box-shadow:0_0_0_1px_rgb(var(--color-primary-100))] dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900))]"
                @click="emit('search')">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Buscar</span>
                <kbd
                    class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono
                     bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                     text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                     [box-shadow:0_0_0_1px_rgb(var(--color-primary-100))] dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-800))]">
                    ⌘K
                </kbd>
            </button>

            <!-- Notification bell -->
            <button class="relative p-2 rounded-xl transition-colors
                 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                 hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
                 hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span v-if="(notificationCount ?? 0) > 0"
                    class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500 ring-2 ring-[rgb(var(--bg-surface))] dark:ring-[rgb(var(--dark-bg-surface))]" />
            </button>

            <!-- Divider -->
            <div class="w-px h-5 mx-1 bg-[rgb(var(--color-primary-100))] dark:bg-[rgb(var(--color-primary-900))]" />

            <!-- Color picker -->
            <div class="relative">
                <button title="Personalizar cor primária" class="p-2 rounded-xl transition-colors
                     text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                     hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]"
                    @click="showColorPicker = !showColorPicker">
                    <div class="w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm"
                        :style="{ background: primaryColor }" />
                </button>

                <Transition name="fade">
                    <div v-if="showColorPicker" v-click-outside="() => (showColorPicker = false)" class="absolute right-0 top-12 rounded-2xl p-4 z-50 w-52
                           bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                           [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_8px_32px_-4px_rgb(var(--color-primary-300)/40%)]
                           dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_8px_32px_-4px_rgb(0_0_0/60%)]">
                        <p class="text-xs font-medium mb-3
                          text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            Cor primária
                        </p>
                        <div class="grid grid-cols-6 gap-2 mb-3">
                            <button v-for="color in presetColors" :key="color.value" data-testid="color-preset"
                                class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110" :style="{
                                    background: color.value,
                                    borderColor: primaryColor === color.value ? color.value : 'transparent',
                                    boxShadow: primaryColor === color.value
                                        ? `0 0 0 2px white, 0 0 0 4px ${color.value}`
                                        : 'none',
                                }" :title="color.label" @click="setPrimaryColor(color.value)" />
                        </div>
                        <label class="flex items-center gap-2 text-xs
                              text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            <span>Custom</span>
                            <input type="color" :value="primaryColor"
                                class="h-7 w-14 rounded cursor-pointer border-0 p-0"
                                @input="setPrimaryColor(($event.target as HTMLInputElement).value)" />
                        </label>
                    </div>
                </Transition>
            </div>

            <!-- Dark mode -->
            <button :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'" class="p-2 rounded-xl transition-colors
                   text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                   hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
                   hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]"
                @click="toggleDark()">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path v-if="isDark" stroke-linecap="round" stroke-linejoin="round"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            </button>

            <!-- Logout -->
            <button title="Sair" class="p-2 rounded-xl transition-colors
               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
               hover:bg-red-50 dark:hover:bg-red-950/50
               hover:text-red-600 dark:hover:text-red-400" @click="emit('logout')">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
    </header>
</template>
