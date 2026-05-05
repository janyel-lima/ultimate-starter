<script setup lang="ts">
// AppToggle.vue — Toggle switch reutilizável com suporte a v-model,
// labels opcionais em cada lado e title para acessibilidade.
//
// Uso:
//   <AppToggle v-model="useStorage" label-left="Firestore" label-right="Storage" />

interface Props {
    modelValue: boolean
    labelLeft?: string
    labelRight?: string
    title?: string
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

function toggle() {
    if (!props.disabled) {
        emit('update:modelValue', !props.modelValue)
    }
}
</script>

<template>
    <div class="flex items-center gap-2">
        <!-- Label esquerda -->
        <span v-if="labelLeft" :class="[
            'text-[10px] font-medium transition-colors select-none',
            !modelValue
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]',
        ]">
            {{ labelLeft }}
        </span>

        <!-- Track + thumb -->
        <button type="button" role="switch" :aria-checked="modelValue" :aria-label="title" :title="title"
            :disabled="disabled" :class="[
                'relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 focus-visible:ring-offset-1',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                modelValue
                    ? 'bg-primary-500'
                    : 'bg-[rgb(var(--color-primary-200))] dark:bg-[rgb(var(--color-primary-800))]',
            ]" @click="toggle">
            <span :class="[
                'absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200',
                modelValue ? 'translate-x-4' : 'translate-x-0',
            ]" />
        </button>

        <!-- Label direita -->
        <span v-if="labelRight" :class="[
            'text-[10px] font-medium transition-colors select-none',
            modelValue
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]',
        ]">
            {{ labelRight }}
        </span>
    </div>
</template>
