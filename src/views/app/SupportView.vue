<script setup lang="ts">
import AppFileDropzone from '@/components/ui/AppFileDropzone.vue'
import AppTicketList, { type SupportTicket } from '@/components/ui/AppTicketList.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import { db, storage } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const authStore = useAuthStore()

// ─────────────────────────────────────────────────────────────────────────────
// Tickets (real-time)
// ─────────────────────────────────────────────────────────────────────────────
const tickets = ref<SupportTicket[]>([])
const ticketsLoading = ref(true)
const ticketsError = ref<string | null>(null)
let unsubTickets: (() => void) | null = null

onMounted(() => {
    if (!authStore.user?.uid) return
    const q = query(
        collection(db, 'support_tickets'),
        where('userId', '==', authStore.user.uid),
        orderBy('createdAt', 'desc'),
    )
    unsubTickets = onSnapshot(q, snap => {
        tickets.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SupportTicket[]
        ticketsLoading.value = false
    }, () => {
        ticketsError.value = 'Não foi possível carregar seus tickets.'
        ticketsLoading.value = false
    })
})

onUnmounted(() => unsubTickets?.())

// ─────────────────────────────────────────────────────────────────────────────
// Formulário
// ─────────────────────────────────────────────────────────────────────────────
type Category = 'duvida' | 'bug' | 'sugestao' | 'melhoria'

const categories: { value: Category; label: string; description: string; icon: string }[] = [
    { value: 'duvida', label: 'Dúvida', description: 'Pergunta sobre como usar', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { value: 'bug', label: 'Bug', description: 'Algo não funciona corretamente', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { value: 'sugestao', label: 'Sugestão', description: 'Ideia para melhorar o produto', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { value: 'melhoria', label: 'Melhoria', description: 'Solicitar nova funcionalidade', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
]

const categoryColorMap: Record<Category, { ring: string; bg: string; text: string; icon: string }> = {
    duvida: { ring: 'ring-sky-400/60 dark:ring-sky-500/50', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', icon: 'text-sky-500' },
    bug: { ring: 'ring-rose-400/60 dark:ring-rose-500/50', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', icon: 'text-rose-500' },
    sugestao: { ring: 'ring-amber-400/60 dark:ring-amber-500/50', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-500' },
    melhoria: { ring: 'ring-primary-400/60 dark:ring-primary-500/50', bg: 'bg-primary-50 dark:bg-primary-950/40', text: 'text-primary-700 dark:text-primary-300', icon: 'text-primary-500' },
}

const selectedCategory = ref<Category | null>(null)
const title = ref('')
const description = ref('')
const screenshotFile = ref<File | null>(null)
const dropzoneRef = ref<InstanceType<typeof AppFileDropzone> | null>(null)
const useStorageUpload = ref(false)
const isSubmitting = ref(false)
const submitted = ref(false)
const ticketId = ref('')
const formError = ref<string | null>(null)

const maxFileSizeBytes = computed(() => useStorageUpload.value ? 5 * 1024 * 1024 : 700 * 1024)
const maxFileSizeLabel = computed(() => useStorageUpload.value ? '5 MB' : '700 KB')

const isValid = computed(() =>
    selectedCategory.value !== null &&
    title.value.trim().length >= 5 &&
    description.value.trim().length >= 10
)

function handleToggleStorageMode(newValue: boolean) {
    useStorageUpload.value = newValue
    if (screenshotFile.value && screenshotFile.value.size > maxFileSizeBytes.value) {
        screenshotFile.value = null
        formError.value = `Imagem removida — excede ${maxFileSizeLabel.value} no modo atual.`
    }
}

function collectSystemMeta() {
    return {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        online: navigator.onLine,
        platform: navigator.platform,
        url: window.location.href,
        appVersion: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
        colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        devicePixelRatio: window.devicePixelRatio,
    }
}

async function handleSubmit() {
    if (!isValid.value || isSubmitting.value) return
    isSubmitting.value = true
    formError.value = null
    try {
        let screenshotUrl: string | null = null
        if (screenshotFile.value) {
            try {
                if (useStorageUpload.value) {
                    const ext = screenshotFile.value.name.split('.').pop()
                    const path = `support-screenshots/${authStore.user?.uid}/${Date.now()}.${ext}`
                    const sRef = storageRef(storage, path)
                    const snap = await uploadBytes(sRef, screenshotFile.value)
                    screenshotUrl = await getDownloadURL(snap.ref)
                } else {
                    screenshotUrl = dropzoneRef.value?.preview ?? null
                }
            } catch { /* screenshot é opcional */ }
        }

        const ticketData: Record<string, unknown> = {
            category: selectedCategory.value,
            title: title.value.trim(),
            description: description.value.trim(),
            userId: authStore.user?.uid ?? null,
            userEmail: authStore.user?.email ?? null,
            userDisplayName: authStore.userDisplayName ?? null,
            meta: collectSystemMeta(),
            status: 'aberto',
            createdAt: serverTimestamp(),
        }
        if (screenshotUrl) ticketData.screenshotUrl = screenshotUrl

        const docRef = await addDoc(collection(db, 'support_tickets'), ticketData)
        ticketId.value = docRef.id.slice(0, 8).toUpperCase()
        submitted.value = true
    } catch {
        formError.value = 'Não foi possível enviar seu ticket. Tente novamente.'
    } finally {
        isSubmitting.value = false
    }
}

function resetForm() {
    selectedCategory.value = null
    title.value = ''
    description.value = ''
    screenshotFile.value = null
    submitted.value = false
    ticketId.value = ''
    formError.value = null
}
</script>

<template>
    <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,480px)_1fr] gap-4 sm:gap-5 items-start">

            <!-- ══ COLUNA ESQUERDA — Formulário ══ -->
            <div class="space-y-4 sm:space-y-5">

                <!-- Header da seção -->
                <div
                    class="relative overflow-hidden rounded-xl sm:rounded-2xl p-5 sm:p-7
                            bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                            [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_4px_24px_-4px_rgb(var(--color-primary-200)/40%)]
                            dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_4px_24px_-4px_rgb(var(--color-primary-950)/60%)]">
                    <div class="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10
                                bg-primary-400 dark:bg-primary-600 blur-3xl pointer-events-none" />
                    <div class="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-[0.07]
                                bg-secondary-400 dark:bg-secondary-600 blur-2xl pointer-events-none" />
                    <div class="relative flex items-start gap-4">
                        <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                                    bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/25">
                            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                stroke-width="1.75">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 class="text-base sm:text-lg font-semibold
                                       text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                Abrir ticket de suporte
                            </h1>
                            <p class="mt-0.5 text-xs sm:text-sm leading-relaxed
                                       text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                Dados técnicos do seu ambiente são coletados automaticamente para agilizar o
                                diagnóstico.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Sucesso -->
                <Transition name="fade-up" appear>
                    <div v-if="submitted"
                        class="rounded-xl sm:rounded-2xl overflow-hidden
                               bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                               [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_8px_32px_-8px_rgb(var(--color-primary-200)/50%)]
                               dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_8px_32px_-8px_rgb(var(--color-primary-950)/70%)]">
                        <div class="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
                        <div class="p-8 text-center">
                            <div class="relative mx-auto w-14 h-14 mb-4">
                                <div
                                    class="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-950/50 animate-ping opacity-40" />
                                <div class="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500
                                            flex items-center justify-center shadow-xl shadow-emerald-500/30">
                                    <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <h2 class="text-lg font-semibold mb-1
                                       text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                Ticket enviado!
                            </h2>
                            <p
                                class="text-sm mb-1 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                Nossa equipe já recebeu e irá analisar em breve.
                            </p>
                            <p
                                class="text-xs font-mono mb-5 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                Ticket
                                <span
                                    class="px-2 py-0.5 rounded-md
                                             bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                                             text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                    #{{ ticketId }}
                                </span>
                            </p>
                            <button @click="resetForm" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                                       bg-gradient-to-r from-primary-500 to-primary-600 text-white
                                       shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50
                                       hover:-translate-y-0.5 transition-all duration-200 active:scale-95">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Novo ticket
                            </button>
                        </div>
                    </div>
                </Transition>

                <!-- Formulário -->
                <Transition name="fade-up" appear>
                    <div v-if="!submitted"
                        class="rounded-xl sm:rounded-2xl overflow-hidden
                               bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                               [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_4px_24px_-4px_rgb(var(--color-primary-200)/40%)]
                               dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_4px_24px_-4px_rgb(var(--color-primary-950)/60%)]">
                        <div class="p-5 sm:p-7 space-y-6">

                            <!-- 1. Categoria -->
                            <fieldset>
                                <legend class="text-xs font-semibold uppercase tracking-widest mb-3
                                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                    1 — Tipo de contato
                                </legend>
                                <div class="grid grid-cols-2 gap-2">
                                    <button v-for="cat in categories" :key="cat.value" type="button" :class="[
                                        'relative flex flex-col items-start gap-1.5 p-3 rounded-xl text-left',
                                        'border-2 transition-all duration-200 active:scale-[0.98]',
                                        selectedCategory === cat.value
                                            ? ['border-transparent ring-2', categoryColorMap[cat.value].ring, categoryColorMap[cat.value].bg]
                                            : 'border-transparent bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))] [box-shadow:0_0_0_1px_rgb(var(--color-primary-100))] dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900))] hover:bg-[rgb(var(--bg-surface))] dark:hover:bg-[rgb(var(--dark-bg-surface))]',
                                    ]" @click="selectedCategory = cat.value">
                                        <Transition name="scale-pop">
                                            <span v-if="selectedCategory === cat.value" class="absolute top-2 right-2 w-4 h-4 rounded-full shadow-sm
                                                       bg-white dark:bg-[rgb(var(--dark-bg-surface))]
                                                       flex items-center justify-center">
                                                <svg class="w-2.5 h-2.5" :class="categoryColorMap[cat.value].icon"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    stroke-width="3">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M5 13l4 4L19 7" />
                                                </svg>
                                            </span>
                                        </Transition>
                                        <div
                                            class="w-7 h-7 rounded-lg flex items-center justify-center bg-white/60 dark:bg-black/20">
                                            <svg class="w-4 h-4"
                                                :class="selectedCategory === cat.value ? categoryColorMap[cat.value].icon : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]'"
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                stroke-width="1.75">
                                                <path stroke-linecap="round" stroke-linejoin="round" :d="cat.icon" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p
                                                :class="['text-xs font-semibold leading-none',
                                                    selectedCategory === cat.value
                                                        ? categoryColorMap[cat.value].text
                                                        : 'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]']">
                                                {{ cat.label }}
                                            </p>
                                            <p
                                                class="mt-1 text-[10px] leading-snug hidden sm:block
                                                       text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                {{ cat.description }}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </fieldset>

                            <div
                                class="h-px bg-gradient-to-r from-transparent via-primary-100 to-transparent dark:via-primary-900" />

                            <!-- 2. Título -->
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-widest mb-2
                                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                    2 — Resumo
                                </label>
                                <div class="relative">
                                    <input v-model="title" type="text" maxlength="120"
                                        placeholder="Ex: Botão de confirmação não responde" :class="[
                                            'w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 outline-none ring-1',
                                            'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]',
                                            'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]',
                                            'placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]',
                                            title.length >= 5
                                                ? 'ring-primary-300/60 dark:ring-primary-700/60'
                                                : 'ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]',
                                            'focus:ring-2 focus:ring-primary-400/80 dark:focus:ring-primary-500/80',
                                        ]" />
                                    <span
                                        class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono
                                                 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                        {{ title.length }}/120
                                    </span>
                                </div>
                            </div>

                            <!-- 3. Descrição -->
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-widest mb-2
                                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                    3 — Detalhes
                                </label>
                                <div class="relative">
                                    <textarea v-model="description" rows="4" maxlength="2000"
                                        placeholder="Descreva o que aconteceu e o que esperava que acontecesse…" :class="[
                                            'w-full rounded-xl px-4 py-3 text-sm resize-none transition-all duration-200 outline-none ring-1',
                                            'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]',
                                            'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]',
                                            'placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]',
                                            description.length >= 10
                                                ? 'ring-primary-300/60 dark:ring-primary-700/60'
                                                : 'ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]',
                                            'focus:ring-2 focus:ring-primary-400/80 dark:focus:ring-primary-500/80',
                                        ]" />
                                    <span
                                        class="absolute right-3 bottom-3 text-[10px] font-mono
                                                 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                        {{ description.length }}/2000
                                    </span>
                                </div>
                            </div>

                            <!-- 4. Screenshot -->
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <label
                                        class="text-xs font-semibold uppercase tracking-widest
                                                   text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                        4 — Print
                                        <span class="normal-case tracking-normal font-normal ml-1 opacity-60">
                                            (opcional · {{ maxFileSizeLabel }})
                                        </span>
                                    </label>
                                    <AppToggle :model-value="useStorageUpload" label-left="Firestore"
                                        label-right="Storage" :title="useStorageUpload
                                            ? 'Usando Firebase Storage (Blaze)'
                                            : 'Usando base64 no Firestore (Spark)'"
                                        @update:model-value="handleToggleStorageMode" />
                                </div>
                                <AppFileDropzone ref="dropzoneRef" v-model="screenshotFile"
                                    :max-size-bytes="maxFileSizeBytes" :max-size-label="maxFileSizeLabel"
                                    accept="image/*" hint="PNG, JPG, WebP" @error="(msg) => (formError = msg)" />
                            </div>

                            <!-- Info -->
                            <div
                                class="rounded-xl px-3 py-2.5 flex items-start gap-2.5
                                        bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                                        ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]">
                                <svg class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary-400" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p
                                    class="text-[11px] leading-relaxed text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                    Navegador, sistema e versão do app são coletados automaticamente para diagnóstico.
                                </p>
                            </div>

                            <!-- Erro -->
                            <Transition name="fade-up">
                                <div v-if="formError" class="flex items-start gap-2.5 rounded-xl px-3 py-2.5
                                           bg-rose-50 dark:bg-rose-950/30 ring-1 ring-rose-200 dark:ring-rose-800/60">
                                    <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p class="text-xs text-rose-700 dark:text-rose-300">{{ formError }}</p>
                                </div>
                            </Transition>

                            <!-- Submit -->
                            <div class="flex items-center justify-between pt-1">
                                <div class="flex items-center gap-1.5">
                                    <div v-for="step in [selectedCategory !== null, title.length >= 5, description.length >= 10]"
                                        :key="String(step)"
                                        :class="['h-1 rounded-full transition-all duration-300',
                                            step
                                                ? 'bg-primary-500 w-5'
                                                : 'bg-[rgb(var(--color-primary-200))] dark:bg-[rgb(var(--color-primary-800))] w-3']" />
                                    <span
                                        class="ml-1 text-[10px] font-medium
                                                 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                        {{ [selectedCategory !== null, title.length >= 5, description.length >=
                                            10].filter(Boolean).length }}/3
                                    </span>
                                </div>
                                <button :disabled="!isValid || isSubmitting" @click="handleSubmit" :class="[
                                    'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95',
                                    isValid && !isSubmitting
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 cursor-pointer'
                                        : 'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] cursor-not-allowed',
                                ]">
                                    <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" viewBox="0 0 24 24"
                                        fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    {{ isSubmitting ? 'Enviando…' : 'Enviar ticket' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>

            <!-- ══ COLUNA DIREITA — Ticket List ══ -->
            <div class="xl:sticky xl:top-0">
                <AppTicketList :tickets="tickets" :loading="ticketsLoading" :error="ticketsError" :paginator="true"
                    :enable-search="true" :enable-sort="true" :page-size="5" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-up-enter-active {
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-leave-active {
    transition: all 0.2s ease-in;
}

.fade-up-enter-from,
.fade-up-leave-to {
    opacity: 0;
    transform: translateY(12px);
}

.scale-pop-enter-active {
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-pop-leave-active {
    transition: all 0.15s ease-in;
}

.scale-pop-enter-from,
.scale-pop-leave-to {
    opacity: 0;
    transform: scale(0.5);
}
</style>
