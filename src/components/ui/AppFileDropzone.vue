<script setup lang="ts">
// AppFileDropzone.vue — Área de upload com drag-and-drop, preview de imagem
// e botão de remoção. Gerencia o input[type=file] internamente.
//
// Uso:
//   <AppFileDropzone
//     v-model="screenshotFile"
//     :max-size-bytes="700 * 1024"
//     accept="image/*"
//     hint="PNG, JPG, WebP"
//     @error="msg => formError = msg"
//   />

import { computed, ref } from 'vue'

interface Props {
    /** Arquivo selecionado (v-model) */
    modelValue: File | null
    /** Limite de tamanho em bytes */
    maxSizeBytes?: number
    /** Tipos aceitos pelo input (ex: "image/*") */
    accept?: string
    /** Dica exibida na zona de drop (ex: "PNG, JPG, WebP") */
    hint?: string
    /** Label descritivo do tamanho máximo (ex: "700 KB") */
    maxSizeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
    maxSizeBytes: 5 * 1024 * 1024,
    accept: 'image/*',
    hint: 'PNG, JPG, WebP',
    maxSizeLabel: '5 MB',
})

const emit = defineEmits<{
    'update:modelValue': [file: File | null]
    error: [message: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const preview = ref<string | null>(null)

// Mantém o preview sincronizado ao resetar o modelValue externamente
const hasFile = computed(() => props.modelValue !== null)

function readFile(file: File) {
    if (!file.type.startsWith('image/')) {
        emit('error', 'Apenas imagens são aceitas.')
        return
    }
    if (file.size > props.maxSizeBytes) {
        emit('error', `Imagem deve ter menos de ${props.maxSizeLabel}.`)
        return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
        preview.value = ev.target?.result as string
    }
    reader.readAsDataURL(file)
    emit('update:modelValue', file)
}

function handleChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) readFile(file)
}

function handleDrop(e: DragEvent) {
    isDragging.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) readFile(file)
}

function remove() {
    preview.value = null
    emit('update:modelValue', null)
    if (fileInputRef.value) fileInputRef.value.value = ''
}

/** Expõe o preview para o pai (ex: ao enviar o formulário) */
defineExpose({ preview })
</script>

<template>
    <div>
        <!-- Preview -->
        <Transition name="fade-up">
            <div v-if="hasFile && preview"
                class="relative rounded-xl overflow-hidden mb-2 ring-1 ring-primary-200 dark:ring-primary-800">
                <img :src="preview" class="w-full max-h-36 object-cover object-top" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                <!-- Botão remover -->
                <button type="button" class="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center
                 bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-sm"
                    aria-label="Remover imagem" @click="remove">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </Transition>

        <!-- Drop zone (só quando não há arquivo) -->
        <div v-if="!hasFile" :class="[
            'relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group',
            isDragging
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
                : 'border-[rgb(var(--color-primary-200))] dark:border-[rgb(var(--color-primary-800))] hover:border-primary-300 dark:hover:border-primary-700',
        ]" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop"
            @click="fileInputRef?.click()">
            <div class="flex items-center gap-3 py-4 px-4 pointer-events-none">
                <svg :class="[
                    'w-5 h-5 transition-colors flex-shrink-0',
                    isDragging
                        ? 'text-primary-500'
                        : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] group-hover:text-primary-400',
                ]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                    <p
                        class="text-xs font-medium text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                        {{ isDragging ? 'Solte aqui' : 'Arraste ou clique' }}
                    </p>
                    <p class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                        {{ hint }}
                    </p>
                </div>
            </div>

            <input ref="fileInputRef" type="file" :accept="accept"
                class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" @change="handleChange" />
        </div>
    </div>
</template>

<style scoped>
.fade-up-enter-active {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-leave-active {
    transition: all 0.15s ease-in;
}

.fade-up-enter-from,
.fade-up-leave-to {
    opacity: 0;
    transform: translateY(6px);
}
</style>
