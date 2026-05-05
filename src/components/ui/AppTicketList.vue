<script setup lang="ts">
// ─── Dados estáticos fora do componente → instanciados UMA vez no módulo ───
import AppImageViewer from '@/components/ui/AppImageViewer.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
import { db } from '@/services/firebase'
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    type Timestamp,
} from 'firebase/firestore'
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
type Category = 'duvida' | 'bug' | 'sugestao' | 'melhoria'
type SortOption = 'date_desc' | 'date_asc' | 'status' | 'category'

export interface SupportTicket {
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
// Metadados estáticos — fora do setup, sem reatividade desnecessária
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<Category, {
    label: string; icon: string; borderAccent: string
    typeBadge: string; iconColor: string; bgIcon: string
    detailBanner: string; slaHint: (s: string) => string
}> = {
    bug: {
        label: 'Bug',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        borderAccent: 'border-l-4 border-l-rose-400 dark:border-l-rose-500',
        typeBadge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
        iconColor: 'text-rose-500', bgIcon: 'bg-rose-100 dark:bg-rose-950/40',
        detailBanner: 'Bugs são tratados com prioridade máxima. Nossa equipe analisará o mais rápido possível conforme o calendário de suporte.',
        slaHint: (s) => s === 'resolvido' ? 'Resolvido ✓' : s === 'respondido' ? 'Resposta disponível' : 'Resposta esperada em até 48h úteis',
    },
    duvida: {
        label: 'Dúvida',
        icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        borderAccent: 'border-l-4 border-l-sky-400 dark:border-l-sky-500',
        typeBadge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
        iconColor: 'text-sky-500', bgIcon: 'bg-sky-100 dark:bg-sky-950/40',
        detailBanner: 'Dúvidas são respondidas em ordem de chegada. Tempo médio de resposta: 2–5 dias úteis.',
        slaHint: (s) => s === 'respondido' || s === 'fechado' ? 'Respondida' : 'Resposta em até 5 dias úteis',
    },
    melhoria: {
        label: 'Melhoria',
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        borderAccent: 'border-l-4 border-l-primary-400 dark:border-l-primary-500',
        typeBadge: 'bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300',
        iconColor: 'text-primary-500', bgIcon: 'bg-primary-100 dark:bg-primary-950/40',
        detailBanner: 'Melhorias são avaliadas pela equipe de produto. Você será notificado apenas se for priorizada e implementada.',
        slaHint: (s) => s === 'implementado' ? 'Implementada ✓' : s === 'em_desenvolvimento' ? 'Em desenvolvimento!' : 'Será avaliada pela equipe',
    },
    sugestao: {
        label: 'Sugestão',
        icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        borderAccent: 'border-l-4 border-l-amber-400 dark:border-l-amber-500',
        typeBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
        iconColor: 'text-amber-500', bgIcon: 'bg-amber-100 dark:bg-amber-950/40',
        detailBanner: 'Sugestões são analisadas pela equipe. Caso seja convertida em uma melhoria e implementada, você será notificado.',
        slaHint: (s) => s === 'visualizado' ? 'Vista e anotada ✓' : 'Será analisada pela equipe',
    },
}

const STATUS_DISPLAY: Record<string, { label: string; dot: string; badge: string }> = {
    aberto: { label: 'Aberto', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800/80 dark:text-gray-400' },
    em_analise: { label: 'Em análise', dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' },
    respondido: { label: 'Respondido', dot: 'bg-blue-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' },
    resolvido: { label: 'Resolvido', dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
    fechado: { label: 'Fechado', dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-500' },
    visualizado: { label: 'Visualizado', dot: 'bg-violet-400', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400' },
    em_desenvolvimento: { label: 'Em desenvolvimento', dot: 'bg-primary-400 animate-pulse', badge: 'bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-400' },
    implementado: { label: 'Implementado ✓', dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
}

const FALLBACK_STATUS = { label: '', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'date_desc', label: 'Mais recente' },
    { value: 'date_asc', label: 'Mais antigo' },
    { value: 'status', label: 'Por status' },
    { value: 'category', label: 'Por categoria' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
    tickets: SupportTicket[]
    loading?: boolean
    error?: string | null
    enableSearch?: boolean
    enableSort?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    error: null,
    enableSearch: true,
    enableSort: true,
})

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários de data
// ─────────────────────────────────────────────────────────────────────────────
function toDate(ts: Timestamp | null | undefined): Date | null {
    if (!ts) return null
    return typeof (ts as any).toDate === 'function' ? (ts as any).toDate() : new Date(ts as any)
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
})

function formatDate(ts: Timestamp | null | undefined) {
    const d = toDate(ts)
    return d ? dateFormatter.format(d) : '—'
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

function getStatus(s: string) {
    return STATUS_DISPLAY[s] ?? { ...FALLBACK_STATUS, label: s }
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado de filtros, busca e ordenação
// ─────────────────────────────────────────────────────────────────────────────
const activeFilter = ref<Category | 'todos'>('todos')
const searchQuery = ref('')
const searchInput = ref('')     // valor bruto do input
const showSearch = ref(false)
const sortBy = ref<SortOption>('date_desc')

// Debounce da busca: evita recomputar filteredAndSorted a cada tecla
let searchTimer: ReturnType<typeof setTimeout>
watch(searchInput, (val) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => { searchQuery.value = val }, 250)
})

// categoryCounts: UM único reduce em vez de 4 filter passes separados
const categoryCounts = computed(() => {
    const counts = { todos: 0, bug: 0, duvida: 0, melhoria: 0, sugestao: 0 }
    for (const t of props.tickets) {
        counts.todos++
        if (t.category in counts) counts[t.category as Category]++
    }
    return counts
})

const filteredAndSorted = computed(() => {
    const filter = activeFilter.value
    const q = searchQuery.value.toLowerCase().trim()

    let list = filter === 'todos'
        ? props.tickets
        : props.tickets.filter(t => t.category === filter)

    if (q) {
        list = list.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
        )
    }

    // sort: evitamos spread desnecessário quando não há resultados filtrados
    if (list.length <= 1) return list

    const order = sortBy.value
    return [...list].sort((a, b) => {
        if (order === 'date_desc') return (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0)
        if (order === 'date_asc') return (toDate(a.createdAt)?.getTime() ?? 0) - (toDate(b.createdAt)?.getTime() ?? 0)
        if (order === 'status') return a.status.localeCompare(b.status)
        if (order === 'category') return a.category.localeCompare(b.category)
        return 0
    })
})

watch([activeFilter, searchQuery, sortBy], () => {/* virtual scroller gerencia posição */ })

function toggleSearch() {
    showSearch.value = !showSearch.value
    if (!showSearch.value) { searchInput.value = ''; searchQuery.value = '' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Detalhe do ticket + respostas
// ─────────────────────────────────────────────────────────────────────────────
const selectedTicket = ref<SupportTicket | null>(null)
const responses = shallowRef<TicketResponse[]>([])   // shallowRef: array substituído, não observado item a item
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

onUnmounted(() => {
    unsubResponses?.()
    clearTimeout(searchTimer)
})

// ─────────────────────────────────────────────────────────────────────────────
// Image viewer
// ─────────────────────────────────────────────────────────────────────────────
const viewerOpen = ref(false)
const viewerSrc = ref('')

function openViewer(src: string) {
    viewerSrc.value = src
    viewerOpen.value = true
}
</script>

<template>
    <div
        class="rounded-xl sm:rounded-2xl overflow-hidden
                bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_4px_24px_-4px_rgb(var(--color-primary-200)/40%)]
                dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_4px_24px_-4px_rgb(var(--color-primary-950)/60%)]">

        <!-- ── HEADER ──────────────────────────────────────── -->
        <div class="flex items-center justify-between px-5 py-4 border-b
                    border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
            <div class="flex items-center gap-2.5">
                <Transition name="scale-pop">
                    <button v-if="selectedTicket" @click="closeDetail" class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                               bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                               hover:bg-primary-50 dark:hover:bg-primary-950/40
                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                               hover:text-primary-500">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
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
                        {{ filteredAndSorted.length }} de {{ tickets.length }} ticket{{ tickets.length !== 1 ? 's' : ''
                        }}
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-1.5">
                <AppStatusBadge v-if="selectedTicket" :label="getStatus(selectedTicket.status).label"
                    :dot="getStatus(selectedTicket.status).dot" :badge="getStatus(selectedTicket.status).badge" />

                <template v-if="!selectedTicket">
                    <button v-if="enableSearch" @click="toggleSearch" :class="[
                        'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                        showSearch
                            ? 'bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400'
                            : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]',
                    ]" title="Buscar">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>

                    <select v-if="enableSort" v-model="sortBy" class="select-arrow h-8 pl-2 pr-7 rounded-lg text-[11px] font-medium
                               appearance-none cursor-pointer transition-all outline-none
                               bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                               border border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]
                               hover:border-primary-300 dark:hover:border-primary-700
                               focus:border-primary-400 dark:focus:border-primary-600">
                        <option v-for="opt in SORT_OPTIONS" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </template>
            </div>
        </div>

        <!-- ── SEARCH BAR ──────────────────────────────────── -->
        <Transition name="search-slide">
            <div v-if="showSearch && !selectedTicket"
                class="px-4 pt-3 pb-1 border-b border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
                <div class="relative">
                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                                text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <!-- v-model em searchInput (bruto), não em searchQuery (debounced) -->
                    <input v-model="searchInput" type="text" placeholder="Buscar por título ou descrição…" class="w-full pl-9 pr-9 py-2 rounded-xl text-xs outline-none ring-1 transition-all
                               bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                               text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                               placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]
                               ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]
                               focus:ring-primary-400/80 dark:focus:ring-primary-500/80" />
                    <button v-if="searchInput" @click="searchInput = ''; searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center
                               text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-heading))] transition-colors">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p v-if="searchQuery"
                    class="text-[10px] mt-1.5 mb-0.5 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                    {{ filteredAndSorted.length }} resultado{{ filteredAndSorted.length !== 1 ? 's' : '' }}
                    para "<span class="text-primary-600 dark:text-primary-400 font-medium">{{ searchQuery }}</span>"
                </p>
            </div>
        </Transition>

        <!-- ── CATEGORY TABS ───────────────────────────────── -->
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
                    <span v-if="f.count > 0" :class="['text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                        activeFilter === f.key
                            ? 'bg-primary-200/60 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]']">
                        {{ f.count }}
                    </span>
                </button>
            </div>
        </Transition>

        <!-- ── CONTENT ─────────────────────────────────────── -->
        <div>
            <!-- Loading -->
            <div v-if="loading" class="p-4 space-y-2">
                <div v-for="i in 4" :key="i"
                    class="h-16 rounded-xl animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]" />
            </div>

            <!-- Error -->
            <div v-else-if="error" class="p-6 text-center">
                <p class="text-xs text-rose-500">{{ error }}</p>
            </div>

            <!-- ── DETALHE ──────────────────────────────────── -->
            <Transition name="slide-in" mode="out-in">
                <div v-if="selectedTicket" :key="selectedTicket.id" class="p-5 space-y-5">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold',
                                CATEGORY_META[selectedTicket.category].typeBadge]">
                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    stroke-width="1.75">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        :d="CATEGORY_META[selectedTicket.category].icon" />
                                </svg>
                                {{ CATEGORY_META[selectedTicket.category].label }}
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
                            <span class="font-semibold block mb-0.5">Obrigado pela sugestão! 🙏</span>
                            Nossa equipe a recebeu, analisou e tomou nota.
                        </template>
                        <template v-else>
                            {{ CATEGORY_META[selectedTicket.category].detailBanner }}
                        </template>
                    </div>

                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-widest mb-2
                                   text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">Descrição</p>
                        <div
                            class="rounded-xl px-4 py-3 text-xs leading-relaxed
                                    bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                                    text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                                    ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]">
                            {{ selectedTicket.description }}
                        </div>
                    </div>

                    <div v-if="selectedTicket.screenshotUrl">
                        <p class="text-[10px] font-semibold uppercase tracking-widest mb-2
                                   text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">Screenshot
                        </p>
                        <div class="relative group cursor-zoom-in rounded-xl overflow-hidden
                                    ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]"
                            @click="openViewer(selectedTicket.screenshotUrl!)">
                            <img :src="selectedTicket.screenshotUrl" class="w-full max-h-44 object-cover object-top transition-all duration-300
                                       group-hover:scale-[1.02] group-hover:brightness-90" />
                            <div class="absolute inset-0 flex items-center justify-center opacity-0
                                        group-hover:opacity-100 transition-all duration-200
                                        bg-black/20 backdrop-blur-[1px]">
                                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                            bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Ver em tela cheia
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-widest mb-3
                                   text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            Respostas
                            <span v-if="responses.length > 0" class="ml-1.5 px-1.5 py-0.5 rounded-full font-semibold
                                       bg-primary-100 dark:bg-primary-950/60
                                       text-primary-700 dark:text-primary-300">
                                {{ responses.length }}
                            </span>
                        </p>

                        <div v-if="responsesLoading" class="space-y-2">
                            <div
                                class="h-12 rounded-xl animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]" />
                        </div>

                        <div v-else-if="responses.length === 0"
                            class="rounded-xl px-4 py-5 text-center
                                   bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                                   ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]">
                            <svg class="w-6 h-6 mx-auto mb-2 opacity-40 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p class="text-xs text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                {{ CATEGORY_META[selectedTicket.category].slaHint(selectedTicket.status) }}
                            </p>
                        </div>

                        <div v-else class="space-y-3">
                            <div v-for="r in responses" :key="r.id" :class="[
                                'rounded-xl px-4 py-3 text-xs leading-relaxed',
                                r.author === 'equipe'
                                    ? 'bg-primary-50 dark:bg-primary-950/30 ring-1 ring-primary-200 dark:ring-primary-800/50'
                                    : 'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))] ring-1 ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]'
                            ]">
                                <div class="flex items-center justify-between mb-1.5">
                                    <span
                                        :class="['font-semibold',
                                            r.author === 'equipe'
                                                ? 'text-primary-700 dark:text-primary-300'
                                                : 'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]']">
                                        {{ r.author === 'equipe' ? '🛠 Equipe de suporte' : '👤 ' + r.authorName }}
                                    </span>
                                    <span
                                        class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                        {{ timeAgo(r.createdAt) }}
                                    </span>
                                </div>
                                <p class="text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                    {{ r.content }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- ── LISTA com DynamicScroller ───────────────── -->
            <Transition name="slide-in" mode="out-in">
                <div v-if="!selectedTicket && !loading">

                    <!-- Empty state -->
                    <div v-if="filteredAndSorted.length === 0" class="p-8 text-center">
                        <div class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center
                                    bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]">
                            <svg class="w-6 h-6 opacity-40 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p
                            class="text-sm font-medium text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            {{ searchQuery
                                ? 'Nenhum resultado encontrado'
                                : activeFilter === 'todos'
                                    ? 'Nenhum ticket aberto'
                                    : 'Nenhum ticket nessa categoria' }}
                        </p>
                        <p class="mt-1 text-xs text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            {{ searchQuery
                                ? 'Tente outros termos de busca.'
                                : 'Use o formulário ao lado para abrir seu primeiro ticket.' }}
                        </p>
                        <button v-if="searchQuery" @click="searchInput = ''; searchQuery = ''"
                            class="mt-3 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                            Limpar busca
                        </button>
                    </div>

                    <!-- Virtual list: apenas os itens visíveis no viewport são renderizados no DOM -->
                    <DynamicScroller v-else :items="filteredAndSorted" :min-item-size="88" key-field="id"
                        class="xl:max-h-[calc(100vh-18rem)] scroller-list">
                        <template #default="{ item: ticket, active }">
                            <DynamicScrollerItem :item="ticket" :active="active"
                                :size-dependencies="[ticket.title, ticket.status, ticket.category]">

                                <button
                                    class="w-full text-left transition-colors duration-150
                                               hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
                                               border-b border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]"
                                    @click="selectTicket(ticket)">
                                    <div
                                        :class="['flex items-start gap-3 px-4 py-4', CATEGORY_META[ticket.category].borderAccent]">

                                        <div :class="['w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5',
                                            CATEGORY_META[ticket.category].bgIcon]">
                                            <svg class="w-4 h-4" :class="CATEGORY_META[ticket.category].iconColor"
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                stroke-width="1.75">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    :d="CATEGORY_META[ticket.category].icon" />
                                            </svg>
                                        </div>

                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-start justify-between gap-2 mb-1">
                                                <p
                                                    class="text-xs font-semibold leading-snug truncate
                                                           text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                                    {{ ticket.title }}
                                                </p>
                                                <AppStatusBadge :label="getStatus(ticket.status).label"
                                                    :dot="getStatus(ticket.status).dot"
                                                    :badge="getStatus(ticket.status).badge" class="flex-shrink-0" />
                                            </div>

                                            <div class="flex items-center justify-between">
                                                <span :class="['text-[10px] font-medium px-1.5 py-0.5 rounded-md',
                                                    CATEGORY_META[ticket.category].typeBadge]">
                                                    {{ CATEGORY_META[ticket.category].label }}
                                                </span>
                                                <div class="flex items-center gap-2">
                                                    <span v-if="ticket.status === 'respondido'"
                                                        class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                    <span v-if="ticket.screenshotUrl"
                                                        class="w-3.5 h-3.5 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] opacity-50">
                                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                            stroke-width="1.75">
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </span>
                                                    <span
                                                        class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                        {{ timeAgo(ticket.createdAt) }}
                                                    </span>
                                                    <svg class="w-3.5 h-3.5 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]"
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                        stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            <p
                                                class="mt-1.5 text-[10px] italic opacity-70
                                                       text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                                {{ CATEGORY_META[ticket.category].slaHint(ticket.status) }}
                                            </p>
                                        </div>
                                    </div>
                                </button>

                            </DynamicScrollerItem>
                        </template>
                    </DynamicScroller>
                </div>
            </Transition>
        </div>
    </div>

    <AppImageViewer :src="viewerSrc" :open="viewerOpen" @close="viewerOpen = false" />
</template>

<style scoped>
.select-arrow {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 4px center;
    background-repeat: no-repeat;
    background-size: 16px 16px;
}

/* vue-virtual-scroller precisa de overflow explícito no elemento raiz */
.scroller-list {
    overflow-y: auto;
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

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
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

.search-slide-enter-active {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-slide-leave-active {
    transition: all 0.15s ease-in;
}

.search-slide-enter-from,
.search-slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.scrollbar-none {
    scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
    display: none;
}
</style>
