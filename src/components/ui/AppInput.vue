<script setup lang="ts">
// AppInput.vue — Campo de texto reutilizável com label, erro e hint.
// Suporta v-model e expõe o input nativo via template ref.

interface Props {
    modelValue?: string
    label?: string
    type?: string
    placeholder?: string
    error?: string
    hint?: string
    autocomplete?: string
    required?: boolean
    disabled?: boolean
    id?: string
}

const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    required: false,
    disabled: false,
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

// ID gerado automaticamente se não fornecido
const inputId = props.id ?? `input-${Math.random().toString(36).slice(2, 9)}`
</script>

<template>
    <div class="flex flex-col gap-1.5">
        <label v-if="label" :for="inputId" class="text-sm font-medium text-slate-700 dark:text-slate-300">
            {{ label }}
            <span v-if="required" class="text-red-500 ml-0.5" aria-hidden="true">*</span>
        </label>

        <div class="relative">
            <!-- Slot para ícone à esquerda -->
            <div v-if="$slots.leading"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <slot name="leading" />
            </div>

            <input :id="inputId" :type="type" :value="modelValue" :placeholder="placeholder"
                :autocomplete="autocomplete" :required="required" :disabled="disabled" :class="[
                    'w-full rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50',
                    'placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm',
                    'focus:outline-none focus:ring-2 focus:border-transparent transition-shadow',
                    $slots.leading ? 'pl-9 pr-3.5 py-2.5' : 'px-3.5 py-2.5',
                    $slots.trailing ? 'pr-9' : '',
                    error
                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500',
                    disabled ? 'opacity-50 cursor-not-allowed' : '',
                ]" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />

            <!-- Slot para ícone à direita (ex: toggle de senha) -->
            <div v-if="$slots.trailing" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <slot name="trailing" />
            </div>
        </div>

        <p v-if="error" class="text-xs text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
        <p v-else-if="hint" class="text-xs text-slate-500 dark:text-slate-400">{{ hint }}</p>
    </div>
</template>
