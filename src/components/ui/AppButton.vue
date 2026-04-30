<script setup lang="ts">
// AppButton.vue — Botão reutilizável com variantes e estado de loading.
// Substitui os <button> inline espalhados pelas views.

interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button',
    fullWidth: false,
})

const variantClasses = {
    primary:
        'bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white focus:ring-primary-500',
    secondary:
        'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:ring-slate-400',
    ghost:
        'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 focus:ring-slate-400',
    danger:
        'bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white focus:ring-red-500',
}

const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
}
</script>

<template>
    <button :type="type" :disabled="disabled || loading" :class="[
        'inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
    ]">
        <!-- Spinner de loading -->
        <svg v-if="loading" class="animate-spin" :class="size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <slot />
    </button>
</template>
