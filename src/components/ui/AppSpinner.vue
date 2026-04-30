<script setup lang="ts">
interface Props {
    size?: 'sm' | 'md' | 'lg'
    label?: string
}

withDefaults(defineProps<Props>(), {
    size: 'md',
    label: 'Carregando...',
})

const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
</script>

<template>
    <div role="status" class="inline-flex items-center gap-2">
        <svg :class="['animate-spin text-primary-500', sizeClass[size]]" fill="none" viewBox="0 0 24 24"
            aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="sr-only">{{ label }}</span>
    </div>
</template>
