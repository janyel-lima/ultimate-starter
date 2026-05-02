<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

interface PresetColor {
    label: string
    value: string
}

defineProps<{
    title?: string
    presetColors: PresetColor[]
}>()

const emit = defineEmits<{
    toggleSidebar: []
    logout: []
}>()

const { isDark, toggleDark, primaryColor, setPrimaryColor } = useTheme()

import { ref } from 'vue';
const showColorPicker = ref(false)
</script>

<template>
    <header class="flex items-center h-16 px-4 gap-4 border-b
           bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
           border-[rgb(var(--bg-border))] dark:border-[rgb(var(--dark-bg-border))]">
        <!-- Sidebar toggle -->
        <button class="p-2 rounded-xl transition-colors
             text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
             hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
             hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]"
            @click="emit('toggleSidebar')">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <h1 class="text-sm font-semibold flex-1
             text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
            {{ title ?? 'Dashboard' }}
        </h1>

        <!-- Actions -->
        <div class="flex items-center gap-2">

            <!-- Color picker -->
            <div class="relative">
                <button title="Personalizar cor primária" class="p-2 rounded-xl transition-colors
                 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                 hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]"
                    @click="showColorPicker = !showColorPicker">
                    <div class="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                        :style="{ background: primaryColor }" />
                </button>

                <Transition name="fade">
                    <div v-if="showColorPicker" v-click-outside="() => (showColorPicker = false)" class="absolute right-0 top-12 rounded-2xl shadow-xl p-4 z-50 w-52 border
                   bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                   border-[rgb(var(--bg-border))] dark:border-[rgb(var(--dark-bg-border))]">
                        <p class="text-xs font-medium mb-3
                      text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            Cor primária
                        </p>
                        <div class="grid grid-cols-6 gap-2 mb-3">
                            <button v-for="color in presetColors" :key="color.value" data-testid="color-preset"
                                class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110" :style="{
                                    background: color.value,
                                    borderColor: primaryColor === color.value ? color.value : 'transparent',
                                    boxShadow:
                                        primaryColor === color.value
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
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path v-if="isDark" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            </button>

            <!-- Logout -->
            <button title="Sair" class="p-2 rounded-xl transition-colors
               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
               hover:bg-red-50 dark:hover:bg-red-950/50
               hover:text-red-600 dark:hover:text-red-400" @click="emit('logout')">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
    </header>
</template>
