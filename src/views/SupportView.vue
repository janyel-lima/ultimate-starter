<script setup lang="ts">
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFileDropzone from '@/components/ui/AppFileDropzone.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
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
    where,
    type Timestamp,
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────
const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)
function initSidebarState() { sidebarOpen.value = window.innerWidth >= 1024 }
let resizeTimer: ReturnType<typeof setTimeout>
function handleResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => { if (window.innerWidth < 1024) sidebarOpen.value = false }, 150)
}
onMounted(() => { initSidebarState(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { window.removeEventListener('resize', handleResize); clearTimeout(resizeTimer) })

const presetColors = [
    { label: 'Indigo', value: '#6366f1' }, { label: 'Violet', value: '#8b5cf6' },
    { label: 'Rose', value: '#f43f5e' }, { label: 'Amber', value: '#f59e0b' },
    { label: 'Teal', value: '#14b8a6' }, { label: 'Sky', value: '#0ea5e9' },
]

async function handleLogout() {
    await authStore.logout()
    router.push({ name: 'login' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
type Category = 'duvida' | 'bug' | 'sugestao' | 'melhoria'

interface SupportTicket {
    id: string
    category: Category
    title: string
    description: string
    status: string
    screenshotUrl?: string | null
    createdAt: Timestamp | null
    userId: string
    userEmail: string | null
}

interface TicketResponse {
    id: string
    author: 'equipe' | 'usuario'
    authorName: string
    content: string
    createdAt: Timestamp | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadados de categoria
// ─────────────────────────────────────────────────────────────────────────────
const categoryMeta: Record<Category, {
    label: string
    icon: string
    borderAccent: string
    typeBadge: string
    iconColor: string
    detailBanner: string
    slaHint: (status: string) => string
}> = {
    bug: {
        label: 'Bug',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        borderAccent: 'border-l-4 border-l-rose-400 dark:border-l-rose-500',
        typeBadge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
        iconColor: 'text-rose-500',
        detailBanner: 'Bugs são tratados com prioridade máxima. Nossa equipe analisará o mais rápido possível conforme o calendário de suporte.',
        slaHint: (s) => s === 'resolvido' ? 'Resolvido ✓' : s === 'respondido' ? 'Resposta disponível' : 'Resposta esperada em até 48h úteis',
    },
    duvida: {
        label: 'Dúvida',
        icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        borderAccent: 'border-l-4 border-l-sky-400 dark:border-l-sky-500',
        typeBadge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
        iconColor: 'text-sky-500',
        detailBanner: 'Dúvidas são respondidas em ordem de chegada. Tempo médio de resposta: 2–5 dias úteis.',
        slaHint: (s) => s === 'respondido' || s === 'fechado' ? 'Respondida' : 'Resposta em até 5 dias úteis',
    },
    melhoria: {
        label: 'Melhoria',
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        borderAccent: 'border-l-4 border-l-primary-400 dark:border-l-primary-500',
        typeBadge: 'bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300',
        iconColor: 'text-primary-500',
        detailBanner: 'Melhorias são avaliadas pela equipe de produto. Você será notificado apenas se for priorizada e implementada.',
        slaHint: (s) => s === 'implementado' ? 'Implementada ✓' : s === 'em_desenvolvimento' ? 'Em desenvolvimento!' : 'Será avaliada pela equipe',
    },
    sugestao: {
        label: 'Sugestão',
        icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        borderAccent: 'border-l-4 border-l-amber-400 dark:border-l-amber-500',
        typeBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
        iconColor: 'text-amber-500',
        detailBanner: 'Sugestões são analisadas pela equipe. Caso seja convertida em uma melhoria e implementada, você será notificado.',
        slaHint: (s) => s === 'visualizado' ? 'Vista e anotada ✓' : 'Será analisada pela equipe',
    },
}

const statusDisplay: Record<string, { label: string; dot: string; badge: string }> = {
    aberto: { label: 'Aberto', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800/80 dark:text-gray-400' },
    em_analise: { label: 'Em análise', dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' },
    respondido: { label: 'Respondido', dot: 'bg-blue-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' },
    resolvido: { label: 'Resolvido', dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
    fechado: { label: 'Fechado', dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-500' },
    visualizado: { label: 'Visualizado', dot: 'bg-violet-400', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400' },
    em_desenvolvimento: { label: 'Em desenvolvimento', dot: 'bg-primary-400 animate-pulse', badge: 'bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-400' },
    implementado: { label: 'Implementado ✓', dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
}

function getStatus(s: string) {
    return statusDisplay[s] ?? { label: s, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários de data
// ─────────────────────────────────────────────────────────────────────────────
function toDate(ts: Timestamp | null | undefined): Date | null {
    if (!ts) return null
    return typeof (ts as unknown as { toDate: () => Date }).toDate === 'function'
        ? (ts as unknown as { toDate: () => Date }).toDate()
        : new Date(ts as unknown as string)
}

function formatDate(ts: Timestamp | null | undefined) {
    const d = toDate(ts)
    if (!d) return '—'
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
}

function timeAgo(ts: Timestamp | null | undefined) {
    const d = toDate(ts)
    if (!d) return '—'
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    const h = Math.floor(min / 60)
    const days = Math.floor(h / 24)
    if (days > 6) return formatDate(ts).split(',')[0]
    if (days > 0) return `há ${days}d`
    if (h > 0) return `há ${h}h`
    if (min > 0) return `há ${min}min`
    return 'agora'
}

// ─────────────────────────────────────────────────────────────────────────────
// Lista de tickets (real-time)
// ─────────────────────────────────────────────────────────────────────────────
const tickets = ref<SupportTicket[]>([])
const ticketsLoading = ref(true)
const ticketsError = ref<string | null>(null)
let unsubTickets: (() => void) | null = null

const activeFilter = ref<Category | 'todos'>('todos')

const categoryCounts = computed(() => ({
    todos: tickets.value.length,
    bug: tickets.value.filter(t => t.category === 'bug').length,
    duvida: tickets.value.filter(t => t.category === 'duvida').length,
    melhoria: tickets.value.filter(t => t.category === 'melhoria').length,
    sugestao: tickets.value.filter(t => t.category === 'sugestao').length,
}))

const filteredTickets = computed(() =>
    activeFilter.value === 'todos'
        ? tickets.value
        : tickets.value.filter(t => t.category === activeFilter.value)
)

// ─────────────────────────────────────────────────────────────────────────────
// Detalhe do ticket + respostas (real-time)
// ─────────────────────────────────────────────────────────────────────────────
const selectedTicket = ref<SupportTicket | null>(null)
const responses = ref<TicketResponse[]>([])
const responsesLoading = ref(false)
let unsubResponses: (() => void) | null = null

function selectTicket(ticket: SupportTicket) {
    selectedTicket.value = ticket
    responses.value = []
    responsesLoading.value = true
    unsubResponses?.()
    const q = query(
        collection(db, 'support_tickets', ticket.id, 'responses'),
        orderBy('createdAt', 'asc'),
    )
    unsubResponses = onSnapshot(q, snap => {
        responses.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) as TicketResponse[]
        responsesLoading.value = false
    }, () => { responsesLoading.value = false })
}

function closeDetail() {
    selectedTicket.value = null
    unsubResponses?.()
    responses.value = []
}

// ─────────────────────────────────────────────────────────────────────────────
// Mount / Unmount
// ─────────────────────────────────────────────────────────────────────────────
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

onUnmounted(() => {
    unsubTickets?.()
    unsubResponses?.()
})

// ─────────────────────────────────────────────────────────────────────────────
// Formulário
// ─────────────────────────────────────────────────────────────────────────────
const categories: { value: Category; label: string; description: string; icon: string }[] = [
    { value: 'duvida', label: 'Dúvida', description: 'Pergunta sobre como usar', icon: categoryMeta.duvida.icon },
    { value: 'bug', label: 'Bug', description: 'Algo não funciona corretamente', icon: categoryMeta.bug.icon },
    { value: 'sugestao', label: 'Sugestão', description: 'Ideia para melhorar o produto', icon: categoryMeta.sugestao.icon },
    { value: 'melhoria', label: 'Melhoria', description: 'Solicitar nova funcionalidade', icon: categoryMeta.melhoria.icon },
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

// Arquivo de screenshot — gerenciado pelo AppFileDropzone via v-model
const screenshotFile = ref<File | null>(null)
const dropzoneRef = ref<InstanceType<typeof AppFileDropzone> | null>(null)

// Modo de upload: false = base64 no Firestore | true = Firebase Storage
const useStorageUpload = ref(false)

const maxFileSizeBytes = computed(() =>
    useStorageUpload.value ? 5 * 1024 * 1024 : 700 * 1024
)
const maxFileSizeLabel = computed(() =>
    useStorageUpload.value ? '5 MB' : '700 KB'
)

const isSubmitting = ref(false)
const submitted = ref(false)
const ticketId = ref('')
const formError = ref<string | null>(null)

const isValid = computed(() =>
    selectedCategory.value !== null &&
    title.value.trim().length >= 5 &&
    description.value.trim().length >= 10
)

/** Ao trocar o modo, revalida o arquivo já selecionado */
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
                    // Estratégia Storage — requer Blaze
                    const ext = screenshotFile.value.name.split('.').pop()
                    const path = `support-screenshots/${authStore.user?.uid}/${Date.now()}.${ext}`
                    const sRef = storageRef(storage, path)
                    const snap = await uploadBytes(sRef, screenshotFile.value)
                    screenshotUrl = await getDownloadURL(snap.ref)
                } else {
                    // Estratégia base64 — salva direto no documento Firestore
                    screenshotUrl = dropzoneRef.value?.preview ?? null
                }
            } catch {
                // Screenshot é opcional — segue sem imagem se falhar
            }
        }
        const docRef = await addDoc(collection(db, 'support_tickets'), {
            category: selectedCategory.value,
            title: title.value.trim(),
            description: description.value.trim(),
            screenshotUrl,
            userId: authStore.user?.uid ?? null,
            userEmail: authStore.user?.email ?? null,
            userDisplayName: authStore.userDisplayName ?? null,
            meta: collectSystemMeta(),
            status: 'aberto',
            createdAt: serverTimestamp(),
        })
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
    <div class="flex h-screen overflow-hidden bg-[rgb(var(--bg-base))] dark:bg-[rgb(var(--dark-bg-base))]">

        <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

        <div class="flex flex-col flex-1 overflow-hidden min-w-0 w-full">

            <AppHeader title="Suporte" :breadcrumb="['Ultimate Starter', 'Suporte']" :preset-colors="presetColors"
                :notification-count="0" @toggle-sidebar="sidebarOpen = !sidebarOpen" @logout="handleLogout"
                @search="() => { }" />

            <main class="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                <div class="max-w-7xl mx-auto">
                    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,480px)_1fr] gap-4 sm:gap-5 items-start">

                        <!-- ══════════════════════════════════════════════════
                 COLUNA ESQUERDA — Formulário
            ═══════════════════════════════════════════════════ -->
                        <div class="space-y-4 sm:space-y-5">

                            <!-- Cabeçalho da seção -->
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
                                        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor" stroke-width="1.75">
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

                            <!-- Estado de sucesso -->
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
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M5 13l4 4L19 7" />
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
                                            <span class="px-2 py-0.5 rounded-md
                                   bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                                   text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                                #{{ ticketId }}
                                            </span>
                                        </p>
                                        <button @click="resetForm" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                             bg-gradient-to-r from-primary-500 to-primary-600 text-white
                             shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5
                             transition-all duration-200 active:scale-95">
                                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="M12 4v16m8-8H4" />
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

                                        <!-- Categoria -->
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
                                                        <span v-if="selectedCategory === cat.value" class="absolute top-2 right-2 w-4 h-4 rounded-full bg-white dark:bg-[rgb(var(--dark-bg-surface))]
                                     flex items-center justify-center shadow-sm">
                                                            <svg class="w-2.5 h-2.5"
                                                                :class="categoryColorMap[cat.value].icon"
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
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                :d="cat.icon" />
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
                                                        <p class="mt-1 text-[10px] leading-snug hidden sm:block
                                       text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                            {{ cat.description }}
                                                        </p>
                                                    </div>
                                                </button>
                                            </div>
                                        </fieldset>

                                        <div
                                            class="h-px bg-gradient-to-r from-transparent via-primary-100 to-transparent dark:via-primary-900" />

                                        <!-- Título -->
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
                                                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono
                                     text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                    {{ title.length }}/120
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Descrição -->
                                        <div>
                                            <label class="block text-xs font-semibold uppercase tracking-widest mb-2
                                    text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                3 — Detalhes
                                            </label>
                                            <div class="relative">
                                                <textarea v-model="description" rows="4" maxlength="2000"
                                                    placeholder="Descreva o que aconteceu e o que esperava que acontecesse…"
                                                    :class="[
                                                        'w-full rounded-xl px-4 py-3 text-sm resize-none transition-all duration-200 outline-none ring-1',
                                                        'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]',
                                                        'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]',
                                                        'placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]',
                                                        description.length >= 10
                                                            ? 'ring-primary-300/60 dark:ring-primary-700/60'
                                                            : 'ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]',
                                                        'focus:ring-2 focus:ring-primary-400/80 dark:focus:ring-primary-500/80',
                                                    ]" />
                                                <span class="absolute right-3 bottom-3 text-[10px] font-mono
                                     text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                    {{ description.length }}/2000
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Screenshot + toggle Storage/Firestore -->
                                        <div>
                                            <div class="flex items-center justify-between mb-2">
                                                <label class="text-xs font-semibold uppercase tracking-widest
                                      text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                    4 — Print
                                                    <span
                                                        class="normal-case tracking-normal font-normal ml-1 opacity-60">
                                                        (opcional · {{ maxFileSizeLabel }})
                                                    </span>
                                                </label>

                                                <!-- ✅ Toggle componentizado -->
                                                <AppToggle :model-value="useStorageUpload" label-left="Firestore"
                                                    label-right="Storage" :title="useStorageUpload
                                                        ? 'Usando Firebase Storage (Blaze)'
                                                        : 'Usando base64 no Firestore (Spark)'"
                                                    @update:model-value="handleToggleStorageMode" />
                                            </div>

                                            <!-- ✅ Dropzone componentizado -->
                                            <AppFileDropzone ref="dropzoneRef" v-model="screenshotFile"
                                                :max-size-bytes="maxFileSizeBytes" :max-size-label="maxFileSizeLabel"
                                                accept="image/*" hint="PNG, JPG, WebP"
                                                @error="(msg) => (formError = msg)" />
                                        </div>

                                        <!-- Aviso dados técnicos -->
                                        <div class="rounded-xl px-3 py-2.5 flex items-start gap-2.5
                                bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                                ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]">
                                            <svg class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary-400" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p
                                                class="text-[11px] leading-relaxed text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                Navegador, sistema e versão do app são coletados automaticamente para
                                                diagnóstico.
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

                                        <!-- Rodapé do form: barra de progresso + submit -->
                                        <div class="flex items-center justify-between pt-1">
                                            <div class="flex items-center gap-1.5">
                                                <div v-for="step in [selectedCategory !== null, title.length >= 5, description.length >= 10]"
                                                    :key="String(step)"
                                                    :class="['h-1 rounded-full transition-all duration-300',
                                                        step
                                                            ? 'bg-primary-500 w-5'
                                                            : 'bg-[rgb(var(--color-primary-200))] dark:bg-[rgb(var(--color-primary-800))] w-3']" />
                                                <span
                                                    class="ml-1 text-[10px] font-medium text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                    {{ [selectedCategory !== null, title.length >= 5, description.length
                                                        >= 10].filter(Boolean).length }}/3
                                                </span>
                                            </div>
                                            <button :disabled="!isValid || isSubmitting" @click="handleSubmit" :class="[
                                                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95',
                                                isValid && !isSubmitting
                                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 cursor-pointer'
                                                    : 'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] cursor-not-allowed',
                                            ]">
                                                <svg v-if="isSubmitting" class="w-4 h-4 animate-spin"
                                                    viewBox="0 0 24 24" fill="none">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10"
                                                        stroke="currentColor" stroke-width="4" />
                                                    <path class="opacity-75" fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor" stroke-width="2">
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

                        <!-- ══════════════════════════════════════════════════
                 COLUNA DIREITA — Meus Tickets
            ═══════════════════════════════════════════════════ -->
                        <div class="xl:sticky xl:top-0">
                            <div
                                class="rounded-xl sm:rounded-2xl overflow-hidden
                       bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                       [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_4px_24px_-4px_rgb(var(--color-primary-200)/40%)]
                       dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_4px_24px_-4px_rgb(var(--color-primary-950)/60%)]">

                                <!-- Header do painel de tickets -->
                                <div class="flex items-center justify-between px-5 py-4 border-b
                            border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
                                    <div class="flex items-center gap-2.5">
                                        <Transition name="scale-pop">
                                            <button v-if="selectedTicket" @click="closeDetail" class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                               bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                               hover:bg-primary-50 dark:hover:bg-primary-950/40
                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                               hover:text-primary-500">
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                        </Transition>
                                        <div>
                                            <h2 class="text-sm font-semibold
                                 text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                                {{ selectedTicket ? 'Detalhes do ticket' : 'Meus tickets' }}
                                            </h2>
                                            <p v-if="!selectedTicket"
                                                class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                {{ categoryCounts.todos }} ticket{{ categoryCounts.todos !== 1 ? 's' :
                                                    ''
                                                }} no total
                                            </p>
                                        </div>
                                    </div>

                                    <!-- ✅ Badge de status no detalhe usando AppStatusBadge -->
                                    <AppStatusBadge v-if="selectedTicket"
                                        :label="getStatus(selectedTicket.status).label"
                                        :dot="getStatus(selectedTicket.status).dot"
                                        :badge="getStatus(selectedTicket.status).badge" />
                                </div>

                                <!-- Filtros (lista) -->
                                <Transition name="fade">
                                    <div v-if="!selectedTicket" class="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-none border-b
                           border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
                                        <button v-for="f in ([
                                            { key: 'todos', label: 'Todos', count: categoryCounts.todos },
                                            { key: 'bug', label: 'Bugs', count: categoryCounts.bug },
                                            { key: 'duvida', label: 'Dúvidas', count: categoryCounts.duvida },
                                            { key: 'melhoria', label: 'Melhorias', count: categoryCounts.melhoria },
                                            { key: 'sugestao', label: 'Sugestões', count: categoryCounts.sugestao },
                                        ] as const)" :key="f.key" :class="[
                                            'flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150',
                                            activeFilter === f.key
                                                ? 'bg-primary-100 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300'
                                                : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]',
                                        ]" @click="activeFilter = f.key as typeof activeFilter.value">
                                            {{ f.label }}
                                            <span v-if="f.count > 0"
                                                :class="['text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                                                    activeFilter === f.key
                                                        ? 'bg-primary-200/60 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                                        : 'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]']">
                                                {{ f.count }}
                                            </span>
                                        </button>
                                    </div>
                                </Transition>

                                <!-- Conteúdo -->
                                <div class="xl:max-h-[calc(100vh-18rem)] xl:overflow-y-auto">

                                    <!-- Loading skeleton -->
                                    <div v-if="ticketsLoading" class="p-4 space-y-2">
                                        <div v-for="i in 3" :key="i"
                                            class="h-16 rounded-xl animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]" />
                                    </div>

                                    <!-- Erro de carregamento -->
                                    <div v-else-if="ticketsError" class="p-6 text-center">
                                        <p class="text-xs text-rose-500">{{ ticketsError }}</p>
                                    </div>

                                    <!-- ── DETALHE DO TICKET ──────────────── -->
                                    <Transition name="slide-in" mode="out-in">
                                        <div v-if="selectedTicket" :key="selectedTicket.id" class="p-5 space-y-5">

                                            <!-- Cabeçalho do ticket -->
                                            <div>
                                                <div class="flex items-center gap-2 mb-2">
                                                    <span
                                                        :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold', categoryMeta[selectedTicket.category].typeBadge]">
                                                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24"
                                                            stroke="currentColor" stroke-width="1.75">
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                :d="categoryMeta[selectedTicket.category].icon" />
                                                        </svg>
                                                        {{ categoryMeta[selectedTicket.category].label }}
                                                    </span>
                                                    <span
                                                        class="text-[10px] font-mono text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                        #{{ selectedTicket.id.slice(0, 8).toUpperCase() }}
                                                    </span>
                                                </div>
                                                <h3 class="text-sm font-semibold leading-snug
                                   text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                                    {{ selectedTicket.title }}
                                                </h3>
                                                <p
                                                    class="mt-1 text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                    Aberto {{ formatDate(selectedTicket.createdAt) }}
                                                </p>
                                            </div>

                                            <!-- Banner de expectativa por categoria -->
                                            <div :class="[
                                                'rounded-xl px-3.5 py-3 text-xs leading-relaxed',
                                                selectedTicket.category === 'bug'
                                                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800/50'
                                                    : selectedTicket.category === 'duvida'
                                                        ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-800/50'
                                                        : selectedTicket.category === 'melhoria'
                                                            ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-800/50'
                                                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800/50'
                                            ]">
                                                <template
                                                    v-if="selectedTicket.category === 'sugestao' && selectedTicket.status === 'visualizado'">
                                                    <span class="font-semibold block mb-0.5">Obrigado pela sugestão!
                                                        🙏</span>
                                                    Nossa equipe a recebeu, analisou e tomou nota. Caso seja convertida
                                                    em uma melhoria e implementada, você será notificado aqui.
                                                </template>
                                                <template v-else>
                                                    {{ categoryMeta[selectedTicket.category].detailBanner }}
                                                </template>
                                            </div>

                                            <!-- Descrição original -->
                                            <div>
                                                <p class="text-[10px] font-semibold uppercase tracking-widest mb-2
                                   text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                    Descrição
                                                </p>
                                                <div
                                                    class="rounded-xl px-4 py-3 text-xs leading-relaxed
                                    bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                                    text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                                    ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]">
                                                    {{ selectedTicket.description }}
                                                </div>
                                            </div>

                                            <!-- Screenshot -->
                                            <div v-if="selectedTicket.screenshotUrl">
                                                <p class="text-[10px] font-semibold uppercase tracking-widest mb-2
                                   text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                    Screenshot
                                                </p>
                                                <a :href="selectedTicket.screenshotUrl" target="_blank" rel="noopener">
                                                    <img :src="selectedTicket.screenshotUrl"
                                                        class="w-full max-h-40 object-cover object-top rounded-xl ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))] hover:opacity-90 transition-opacity" />
                                                </a>
                                            </div>

                                            <!-- Respostas -->
                                            <div>
                                                <p class="text-[10px] font-semibold uppercase tracking-widest mb-3
                                   text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                    Respostas
                                                    <span v-if="responses.length > 0" class="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60
                                   text-primary-700 dark:text-primary-300 font-semibold">
                                                        {{ responses.length }}
                                                    </span>
                                                </p>

                                                <!-- Loading de respostas -->
                                                <div v-if="responsesLoading" class="space-y-2">
                                                    <div
                                                        class="h-12 rounded-xl animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]" />
                                                </div>

                                                <!-- Sem respostas -->
                                                <div v-else-if="responses.length === 0"
                                                    class="rounded-xl px-4 py-5 text-center
                                 bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                                 ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]">
                                                    <svg class="w-6 h-6 mx-auto mb-2 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] opacity-50"
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                        stroke-width="1.5">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    <p
                                                        class="text-xs text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                        {{
                                                            categoryMeta[selectedTicket.category].slaHint(selectedTicket.status)
                                                        }}
                                                    </p>
                                                </div>

                                                <!-- Lista de respostas -->
                                                <div v-else class="space-y-3">
                                                    <div v-for="r in responses" :key="r.id"
                                                        :class="['rounded-xl px-4 py-3 text-xs leading-relaxed',
                                                            r.author === 'equipe'
                                                                ? 'bg-primary-50 dark:bg-primary-950/30 ring-1 ring-primary-200 dark:ring-primary-800/50'
                                                                : 'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))] ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]']">
                                                        <div class="flex items-center justify-between mb-1.5">
                                                            <span
                                                                :class="['font-semibold',
                                                                    r.author === 'equipe'
                                                                        ? 'text-primary-700 dark:text-primary-300'
                                                                        : 'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]']">
                                                                {{ r.author === 'equipe' ? '🛠 Equipe de suporte' :
                                                                    '👤' + r.authorName }}
                                                            </span>
                                                            <span
                                                                class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                                {{ timeAgo(r.createdAt) }}
                                                            </span>
                                                        </div>
                                                        <p
                                                            class="text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                                            {{ r.content }}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Transition>

                                    <!-- ── LISTA DE TICKETS ───────────────── -->
                                    <Transition name="slide-in" mode="out-in">
                                        <div v-if="!selectedTicket && !ticketsLoading">

                                            <!-- Lista vazia -->
                                            <div v-if="filteredTickets.length === 0" class="p-8 text-center">
                                                <div class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center
                                    bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]">
                                                    <svg class="w-6 h-6 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] opacity-50"
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                        stroke-width="1.5">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </div>
                                                <p
                                                    class="text-sm font-medium text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                                    {{ activeFilter === 'todos' ? 'Nenhum ticket aberto' :
                                                        'Nenhum ticket nessa categoria' }}
                                                </p>
                                                <p
                                                    class="mt-1 text-xs text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                    Use o formulário ao lado para abrir seu primeiro ticket.
                                                </p>
                                            </div>

                                            <!-- Cards de ticket -->
                                            <div v-else
                                                class="divide-y divide-[rgb(var(--color-primary-100))] dark:divide-[rgb(var(--color-primary-900))]">
                                                <button v-for="ticket in filteredTickets" :key="ticket.id"
                                                    class="w-full text-left transition-colors duration-150 hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]"
                                                    @click="selectTicket(ticket)">
                                                    <div
                                                        :class="['flex items-start gap-3 px-4 py-4', categoryMeta[ticket.category].borderAccent]">

                                                        <!-- Ícone da categoria -->
                                                        <div :class="[
                                                            'w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5',
                                                            ticket.category === 'bug' ? 'bg-rose-100 dark:bg-rose-950/40'
                                                                : ticket.category === 'duvida' ? 'bg-sky-100 dark:bg-sky-950/40'
                                                                    : ticket.category === 'melhoria' ? 'bg-primary-100 dark:bg-primary-950/40'
                                                                        : 'bg-amber-100 dark:bg-amber-950/40'
                                                        ]">
                                                            <svg class="w-4 h-4"
                                                                :class="categoryMeta[ticket.category].iconColor"
                                                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                                stroke-width="1.75">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                    :d="categoryMeta[ticket.category].icon" />
                                                            </svg>
                                                        </div>

                                                        <!-- Info -->
                                                        <div class="flex-1 min-w-0">
                                                            <div class="flex items-start justify-between gap-2 mb-1">
                                                                <p class="text-xs font-semibold leading-snug truncate
                                           text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                                                    {{ ticket.title }}
                                                                </p>

                                                                <!-- ✅ AppStatusBadge na lista -->
                                                                <AppStatusBadge :label="getStatus(ticket.status).label"
                                                                    :dot="getStatus(ticket.status).dot"
                                                                    :badge="getStatus(ticket.status).badge"
                                                                    class="flex-shrink-0" />
                                                            </div>

                                                            <div class="flex items-center justify-between">
                                                                <span
                                                                    :class="['text-[10px] font-medium px-1.5 py-0.5 rounded-md', categoryMeta[ticket.category].typeBadge]">
                                                                    {{ categoryMeta[ticket.category].label }}
                                                                </span>
                                                                <div class="flex items-center gap-2">
                                                                    <span v-if="ticket.status === 'respondido'"
                                                                        class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                                    <span
                                                                        class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                                        {{ timeAgo(ticket.createdAt) }}
                                                                    </span>
                                                                    <svg class="w-3.5 h-3.5 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]"
                                                                        fill="none" viewBox="0 0 24 24"
                                                                        stroke="currentColor" stroke-width="2">
                                                                        <path stroke-linecap="round"
                                                                            stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>

                                                            <p
                                                                class="mt-1.5 text-[10px] italic text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] opacity-70">
                                                                {{ categoryMeta[ticket.category].slaHint(ticket.status)
                                                                }}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </Transition>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <AppFooter version="v1.0.0" status="operational" />
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

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
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

.slide-in-enter-active {
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-in-leave-active {
    transition: all 0.18s ease-in;
}

.slide-in-enter-from {
    opacity: 0;
    transform: translateX(12px);
}

.slide-in-leave-to {
    opacity: 0;
    transform: translateX(-8px);
}

.scrollbar-none {
    scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
    display: none;
}
</style>
