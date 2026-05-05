<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef, watch, watchEffect } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import AppDetailViewer from './AppDetailViewer.vue'
import type { Column, ColumnType, Density } from './functions/AppDataTable.types'
import { humanizeKey } from './functions/AppDataTable.types'

// ─────────────────────────────────────────────────────────────────────────────
// Sort state
// ─────────────────────────────────────────────────────────────────────────────
interface SortState {
    key: string
    dir: 'asc' | 'desc'
}

// ─────────────────────────────────────────────────────────────────────────────
// Column type inference
// ─────────────────────────────────────────────────────────────────────────────
function inferColumnType(value: unknown): ColumnType {
    if (value === null || value === undefined) return 'text'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/.test(value)) {
            const d = new Date(value)
            if (!isNaN(d.getTime())) return 'date'
        }
    }
    return 'text'
}

function inferColumnsFromRows(
    rows: Record<string, any>[],
    labelMap: Record<string, string> = {}
): Column[] {
    if (!rows.length) return []
    const keySet = new Set<string>()
    rows.forEach(row => Object.keys(row).forEach(k => keySet.add(k)))
    const sampleRow = rows.find(r => Object.values(r).some(v => v !== null && v !== undefined)) ?? rows[0]
    return Array.from(keySet).map(key => ({
        key,
        label: labelMap[key] ?? humanizeKey(key),
        type: inferColumnType(sampleRow[key]),
        sortable: true,
        searchable: true,
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
    columns?: Column[]
    rows: Record<string, any>[]
    labelMap?: Record<string, string>
    rowKey?: string
    loading?: boolean
    error?: string | null
    pageSize?: number
    pageSizeOptions?: number[]
    enableSearch?: boolean
    enableSort?: boolean
    enableMultiSort?: boolean
    enableSelection?: boolean
    enableExport?: boolean
    enableColumnToggle?: boolean
    enableDensity?: boolean
    stickyHeader?: boolean
    exportFilename?: string
    title?: string
    subtitle?: string
    emptyMessage?: string
    emptySubMessage?: string
    rowClass?: (row: Record<string, any>) => string
}

const props = withDefaults(defineProps<Props>(), {
    columns: undefined,
    labelMap: () => ({}),
    rowKey: 'id',
    loading: false,
    error: null,
    pageSize: 10,
    pageSizeOptions: () => [10, 25, 50, 100],
    enableSearch: true,
    enableSort: true,
    enableMultiSort: false,
    enableSelection: false,
    enableExport: true,
    enableColumnToggle: true,
    enableDensity: true,
    stickyHeader: true,
    exportFilename: 'export',
    title: '',
    subtitle: '',
    emptyMessage: 'Nenhum dado encontrado',
    emptySubMessage: 'Tente ajustar os filtros ou termos de busca.',
    rowClass: () => '',
})

const emit = defineEmits<{
    'row-click': [row: Record<string, any>]
    'selection-change': [rows: Record<string, any>[]]
}>()

// ─────────────────────────────────────────────────────────────────────────────
// 🧊 OPTIMIZATION 1: Freeze rows — Vue não instala watchers profundos
// ─────────────────────────────────────────────────────────────────────────────
const frozenRows = computed(() => props.rows.map(Object.freeze))

// ─────────────────────────────────────────────────────────────────────────────
// Resolved columns
// ─────────────────────────────────────────────────────────────────────────────
const resolvedColumns = computed<Column[]>(() => {
    if (props.columns && props.columns.length > 0) {
        return props.columns.map(col => ({
            ...col,
            label: props.labelMap?.[col.key] ?? col.label,
        }))
    }
    return inferColumnsFromRows(props.rows, props.labelMap)
})

// ─────────────────────────────────────────────────────────────────────────────
// Column visibility
// ─────────────────────────────────────────────────────────────────────────────
const hiddenColumns = ref<Set<string>>(new Set(
    (props.columns ?? []).filter(c => c.hidden).map(c => c.key)
))
const showColumnMenu = ref(false)
const visibleColumns = computed(() => resolvedColumns.value.filter(c => !hiddenColumns.value.has(c.key)))

function toggleColumn(key: string) {
    const s = new Set(hiddenColumns.value)
    s.has(key) ? s.delete(key) : s.add(key)
    hiddenColumns.value = s
}

// ─────────────────────────────────────────────────────────────────────────────
// Density
// ─────────────────────────────────────────────────────────────────────────────
const density = ref<Density>('normal')

const densityCellCls = computed<string>(() => ({
    compact: 'px-3 py-1.5 text-[11px]',
    normal: 'px-4 py-3 text-xs',
    comfortable: 'px-5 py-4 text-xs',
}[density.value]))

const densityHeadCls = computed<string>(() => ({
    compact: 'px-3 py-2 text-[10px]',
    normal: 'px-4 py-2.5 text-[10px]',
    comfortable: 'px-5 py-3 text-[10px]',
}[density.value]))

// Altura da linha para o virtual scroller (mobile cards)
const mobileItemSize = computed(() => ({
    compact: 80,
    normal: 100,
    comfortable: 120,
}[density.value]))

// ─────────────────────────────────────────────────────────────────────────────
// 🔍 OPTIMIZATION 2: Search com debounce manual — evita recomputar a cada tecla
// ─────────────────────────────────────────────────────────────────────────────
const searchQuery = ref('')
const rawSearch = ref('')
const showSearch = ref(false)
let _debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(rawSearch, (val) => {
    if (_debounceTimer) clearTimeout(_debounceTimer)
    _debounceTimer = setTimeout(() => { searchQuery.value = val }, 220)
})

function toggleSearch() {
    showSearch.value = !showSearch.value
    if (!showSearch.value) { rawSearch.value = ''; searchQuery.value = '' }
}

onUnmounted(() => { if (_debounceTimer) clearTimeout(_debounceTimer) })

// ─────────────────────────────────────────────────────────────────────────────
// Sort
// ─────────────────────────────────────────────────────────────────────────────
const sorts = ref<SortState[]>([])

function handleSort(col: Column) {
    if (!props.enableSort || !col.sortable) return
    const idx = sorts.value.findIndex(s => s.key === col.key)
    if (props.enableMultiSort) {
        if (idx === -1) { sorts.value = [...sorts.value, { key: col.key, dir: 'asc' }] }
        else if (sorts.value[idx].dir === 'asc') { const u = [...sorts.value]; u[idx].dir = 'desc'; sorts.value = u }
        else { sorts.value = sorts.value.filter(s => s.key !== col.key) }
    } else {
        if (idx === -1) sorts.value = [{ key: col.key, dir: 'asc' }]
        else if (sorts.value[idx].dir === 'asc') sorts.value = [{ key: col.key, dir: 'desc' }]
        else sorts.value = []
    }
}

const getSortDir = (key: string) => sorts.value.find(s => s.key === key)?.dir ?? null
const getSortIndex = (key: string) => { const i = sorts.value.findIndex(s => s.key === key); return i === -1 ? null : i + 1 }

// ─────────────────────────────────────────────────────────────────────────────
// Filter + Sort pipeline (usa frozenRows)
// ─────────────────────────────────────────────────────────────────────────────
const searchableKeys = computed(() =>
    resolvedColumns.value.filter(c => c.searchable !== false).map(c => c.key)
)

const filteredAndSorted = computed(() => {
    let list = frozenRows.value
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(row =>
            searchableKeys.value.some(k => row[k] != null && String(row[k]).toLowerCase().includes(q))
        )
    }
    if (sorts.value.length) {
        list = [...list].sort((a, b) => {
            for (const s of sorts.value) {
                const av = a[s.key], bv = b[s.key]
                if (av == null && bv == null) continue
                if (av == null) return 1
                if (bv == null) return -1
                const cmp = typeof av === 'number' && typeof bv === 'number'
                    ? av - bv
                    : String(av).localeCompare(String(bv), 'pt-BR')
                if (cmp !== 0) return s.dir === 'asc' ? cmp : -cmp
            }
            return 0
        })
    }
    return list
})

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────
const currentPage = ref(1)
const currentPageSize = ref(props.pageSize)
const totalRows = computed(() => filteredAndSorted.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / currentPageSize.value)))

const paginatedRows = computed(() => {
    const s = (currentPage.value - 1) * currentPageSize.value
    return filteredAndSorted.value.slice(s, s + currentPageSize.value)
})

const fromRow = computed(() => totalRows.value === 0 ? 0 : (currentPage.value - 1) * currentPageSize.value + 1)
const toRow = computed(() => Math.min(currentPage.value * currentPageSize.value, totalRows.value))

const visiblePages = computed(() => {
    const total = totalPages.value, cur = currentPage.value
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    if (cur <= 3) return [1, 2, 3, 4, null, total]
    if (cur >= total - 2) return [1, null, total - 3, total - 2, total - 1, total]
    return [1, null, cur - 1, cur, cur + 1, null, total]
})

watch([searchQuery, sorts, currentPageSize], () => { currentPage.value = 1 })

// ─────────────────────────────────────────────────────────────────────────────
// Selection
// ─────────────────────────────────────────────────────────────────────────────
const selectedKeys = ref<Set<any>>(new Set())
const allPageSelected = computed(() => paginatedRows.value.length > 0 && paginatedRows.value.every(r => selectedKeys.value.has(r[props.rowKey])))
const somePageSelected = computed(() => paginatedRows.value.some(r => selectedKeys.value.has(r[props.rowKey])) && !allPageSelected.value)
const selectedCount = computed(() => selectedKeys.value.size)
const selectedRows = computed(() => frozenRows.value.filter(r => selectedKeys.value.has(r[props.rowKey])))
const checkboxAllRef = ref<HTMLInputElement | null>(null)
watchEffect(() => { if (checkboxAllRef.value) checkboxAllRef.value.indeterminate = somePageSelected.value })

function toggleAll() {
    const s = new Set(selectedKeys.value)
    if (allPageSelected.value) paginatedRows.value.forEach(r => s.delete(r[props.rowKey]))
    else paginatedRows.value.forEach(r => s.add(r[props.rowKey]))
    selectedKeys.value = s
    emit('selection-change', frozenRows.value.filter(r => s.has(r[props.rowKey])))
}

function toggleRow(row: Record<string, any>) {
    const s = new Set(selectedKeys.value), k = row[props.rowKey]
    s.has(k) ? s.delete(k) : s.add(k)
    selectedKeys.value = s
    emit('selection-change', frozenRows.value.filter(r => s.has(r[props.rowKey])))
}

function clearSelection() {
    selectedKeys.value = new Set()
    emit('selection-change', [])
}

// ─────────────────────────────────────────────────────────────────────────────
// 🪟 OPTIMIZATION 3: shallowRef — Vue não observa propriedades internas do row
// ─────────────────────────────────────────────────────────────────────────────
const detailRow = shallowRef<Record<string, any> | null>(null)

function openDetail(row: Record<string, any>) {
    detailRow.value = row
    emit('row-click', row)
}

function closeDetail() { detailRow.value = null }

// ─────────────────────────────────────────────────────────────────────────────
// Cell formatting
// ─────────────────────────────────────────────────────────────────────────────
function formatCell(col: Column, row: Record<string, any>): string {
    const val = row[col.key]
    if (col.format) return col.format(val, row)
    if (val == null || val === '') return '—'
    switch (col.type) {
        case 'date': {
            const d = new Date(val)
            return isNaN(d.getTime()) ? String(val) : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
        }
        case 'currency': {
            const n = Number(val)
            return isNaN(n) ? String(val) : (col.prefix ?? 'R$ ') + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + (col.suffix ?? '')
        }
        case 'number': {
            const n = Number(val)
            return isNaN(n) ? String(val) : (col.prefix ?? '') + new Intl.NumberFormat('pt-BR').format(n) + (col.suffix ?? '')
        }
        case 'boolean':
            return val ? 'Sim' : 'Não'
        default:
            return (col.prefix ?? '') + String(val) + (col.suffix ?? '')
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────
const showExportMenu = ref(false)

function getExportData() {
    return selectedCount.value > 0 ? selectedRows.value : filteredAndSorted.value
}

function downloadBlob(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: filename })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showExportMenu.value = false
}

function exportJSON() {
    downloadBlob(JSON.stringify(getExportData(), null, 2), `${props.exportFilename}.json`, 'application/json;charset=utf-8')
}

function exportExcel() {
    const cols = visibleColumns.value
    const data = getExportData()
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const headerRow = cols.map(c => `<Cell ss:StyleID="h"><Data ss:Type="String">${esc(c.label)}</Data></Cell>`).join('')
    const dataRows = data.map(row =>
        '<Row>' + cols.map(col => {
            const raw = row[col.key]
            const isN = (col.type === 'number' || col.type === 'currency') && raw != null && !isNaN(Number(raw))
            const val = isN ? Number(raw) : esc(raw == null ? '' : String(raw))
            return `<Cell><Data ss:Type="${isN ? 'Number' : 'String'}">${val}</Data></Cell>`
        }).join('') + '</Row>'
    ).join('\n')
    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Dados"><Table>
    <Row>${headerRow}</Row>
    ${dataRows}
  </Table></Worksheet>
</Workbook>`
    downloadBlob(xml, `${props.exportFilename}.xls`, 'application/vnd.ms-excel;charset=utf-8')
}

// ─────────────────────────────────────────────────────────────────────────────
// 🖱️ OPTIMIZATION 4: Click outside com refs pontuais — sem listener global caro
// ─────────────────────────────────────────────────────────────────────────────
const exportMenuRef = ref<HTMLElement | null>(null)
const columnMenuRef = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
    if (exportMenuRef.value && !exportMenuRef.value.contains(e.target as Node)) showExportMenu.value = false
    if (columnMenuRef.value && !columnMenuRef.value.contains(e.target as Node)) showColumnMenu.value = false
}

document.addEventListener('click', onDocClick, { passive: true })
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
    <div
        class="rounded-xl sm:rounded-2xl overflow-hidden
                bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_4px_24px_-4px_rgb(var(--color-primary-200)/40%)]
                dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_4px_24px_-4px_rgb(var(--color-primary-950)/60%)]">

        <!-- ── TOOLBAR ───────────────────────────────────────── -->
        <div class="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-3 border-b
                    border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]
                    bg-[rgb(var(--bg-muted))/50%] dark:bg-[rgb(var(--dark-bg-muted))/30%]">

            <div class="flex-1 min-w-0">
                <Transition name="swap" mode="out-in">
                    <div v-if="enableSelection && selectedCount > 0" key="sel" class="flex items-center gap-2">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                                     bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {{ selectedCount }} selecionado{{ selectedCount !== 1 ? 's' : '' }}
                        </span>
                        <button @click="clearSelection"
                            class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:text-rose-500 transition-colors">
                            Limpar
                        </button>
                        <slot name="batch-actions" :selected="selectedRows" :clear="clearSelection" />
                    </div>
                    <div v-else key="title">
                        <p v-if="title" class="text-sm font-semibold leading-tight
                                   text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">{{ title
                            }}</p>
                        <p class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            <span v-if="subtitle">{{ subtitle }} · </span>
                            {{ filteredAndSorted.length }} de {{ rows.length }} registro{{ rows.length !== 1 ? 's' : ''
                            }}
                        </p>
                    </div>
                </Transition>
            </div>

            <slot name="toolbar-actions" />

            <!-- Search toggle -->
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

            <!-- Density -->
            <div v-if="enableDensity" class="hidden sm:flex items-center rounded-lg overflow-hidden
                       border border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
                <button v-for="d in (['compact', 'normal', 'comfortable'] as Density[])" :key="d" @click="density = d"
                    :title="{ compact: 'Compacto', normal: 'Normal', comfortable: 'Confortável' }[d]"
                    :class="['w-7 h-7 flex items-center justify-center transition-all',
                        density === d
                            ? 'bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400'
                            : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]']">
                    <svg v-if="d === 'compact'" class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="2" width="14" height="1.5" rx="0.75" />
                        <rect x="1" y="5" width="14" height="1.5" rx="0.75" />
                        <rect x="1" y="8" width="14" height="1.5" rx="0.75" />
                        <rect x="1" y="11" width="14" height="1.5" rx="0.75" />
                    </svg>
                    <svg v-else-if="d === 'normal'" class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="2" width="14" height="2" rx="1" />
                        <rect x="1" y="7" width="14" height="2" rx="1" />
                        <rect x="1" y="12" width="14" height="2" rx="1" />
                    </svg>
                    <svg v-else class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="2" width="14" height="2.5" rx="1.25" />
                        <rect x="1" y="8.5" width="14" height="2.5" rx="1.25" />
                    </svg>
                </button>
            </div>

            <!-- Column toggle -->
            <div v-if="enableColumnToggle" ref="columnMenuRef" class="relative">
                <button @click.stop="showColumnMenu = !showColumnMenu"
                    :class="['w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                        showColumnMenu
                            ? 'bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400'
                            : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]']"
                    title="Colunas visíveis">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                </button>
                <Transition name="dropdown">
                    <div v-if="showColumnMenu"
                        class="absolute right-0 top-10 z-30 w-48 rounded-xl py-1.5 shadow-xl
                               bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                               border border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
                        <p class="px-3 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-widest
                                  text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">Colunas</p>
                        <label v-for="col in resolvedColumns" :key="col.key" class="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer group
                                   hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]">
                            <input type="checkbox" :checked="!hiddenColumns.has(col.key)"
                                @change="toggleColumn(col.key)"
                                class="w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer" />
                            <span
                                class="text-xs text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">{{
                                col.label }}</span>
                        </label>
                    </div>
                </Transition>
            </div>

            <!-- Export -->
            <div v-if="enableExport" ref="exportMenuRef" class="relative">
                <button @click.stop="showExportMenu = !showExportMenu"
                    :class="['w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                        showExportMenu
                            ? 'bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400'
                            : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]']"
                    title="Exportar">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                <Transition name="dropdown">
                    <div v-if="showExportMenu"
                        class="absolute right-0 top-10 z-30 w-48 rounded-xl py-1.5 shadow-xl
                               bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                               border border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
                        <p class="px-3 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-widest
                                  text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            Exportar {{ selectedCount > 0 ? `(${selectedCount} selecionados)` : '(todos)' }}
                        </p>
                        <button @click="exportJSON" class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors
                                   hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
                                   text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            <span
                                class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">{
                                }</span>
                            JSON
                        </button>
                        <button @click="exportExcel" class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors
                                   hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
                                   text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            <span
                                class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">XL</span>
                            Excel (.xls)
                        </button>
                    </div>
                </Transition>
            </div>
        </div>

        <!-- ── SEARCH BAR ────────────────────────────────────── -->
        <Transition name="search-slide">
            <div v-if="showSearch" class="px-3 sm:px-4 pt-3 pb-2 border-b
                       border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
                <div class="relative">
                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                                text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <!-- rawSearch + debounce — não recomputa a cada tecla -->
                    <input v-model="rawSearch" type="text" placeholder="Buscar em todos os campos…" class="w-full pl-9 pr-9 py-2 rounded-xl text-xs outline-none ring-1 transition-all
                               bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                               text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                               placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]
                               ring-[rgb(var(--color-primary-100))] dark:ring-[rgb(var(--color-primary-900))]
                               focus:ring-primary-400/80 dark:focus:ring-primary-500/80" />
                    <button v-if="rawSearch" @click="rawSearch = ''; searchQuery = ''"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-heading))] transition-colors">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p v-if="searchQuery"
                    class="mt-1.5 text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                    {{ filteredAndSorted.length }} resultado{{ filteredAndSorted.length !== 1 ? 's' : '' }} para
                    "<span class="text-primary-600 dark:text-primary-400 font-medium">{{ searchQuery }}</span>"
                </p>
            </div>
        </Transition>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- ── DESKTOP TABLE ──────────────────────────────────────────── -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <div class="hidden sm:block overflow-x-auto">
            <table class="w-full border-collapse">
                <thead :class="[stickyHeader ? 'sticky top-0 z-10' : '',
                    'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]',
                    'border-b border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]']">
                    <tr>
                        <th v-if="enableSelection" :class="[densityHeadCls, 'w-10 text-center']">
                            <input ref="checkboxAllRef" type="checkbox" :checked="allPageSelected" @change="toggleAll"
                                class="w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer" />
                        </th>
                        <th v-for="col in visibleColumns" :key="col.key"
                            :style="col.width ? { width: col.width, minWidth: col.width } : {}" :class="[
                                densityHeadCls,
                                'font-semibold uppercase tracking-widest whitespace-nowrap select-none',
                                'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]',
                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                                col.sortable && enableSort ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors group' : '',
                                getSortDir(col.key) ? 'text-primary-600 dark:text-primary-400' : '',
                            ]" @click="handleSort(col)">
                            <div
                                :class="['inline-flex items-center gap-1',
                                    col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start']">
                                {{ col.label }}
                                <span v-if="col.sortable && enableSort" class="flex flex-col -space-y-0.5 ml-0.5">
                                    <svg :class="['w-2.5 h-2.5 transition-all', getSortDir(col.key) === 'asc' ? 'text-primary-500' : 'opacity-30 group-hover:opacity-60']"
                                        viewBox="0 0 10 6" fill="currentColor">
                                        <path d="M5 0L9.33 6H0.67L5 0z" />
                                    </svg>
                                    <svg :class="['w-2.5 h-2.5 transition-all', getSortDir(col.key) === 'desc' ? 'text-primary-500' : 'opacity-30 group-hover:opacity-60']"
                                        viewBox="0 0 10 6" fill="currentColor">
                                        <path d="M5 6L0.67 0H9.33L5 6z" />
                                    </svg>
                                </span>
                                <span v-if="enableMultiSort && getSortIndex(col.key)"
                                    class="text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center bg-primary-500 text-white leading-none">
                                    {{ getSortIndex(col.key) }}
                                </span>
                            </div>
                        </th>
                        <th v-if="$slots['row-actions']" :class="[densityHeadCls, 'w-12 text-right']" />
                    </tr>
                </thead>

                <tbody
                    class="divide-y divide-[rgb(var(--color-primary-100))] dark:divide-[rgb(var(--color-primary-900))]">
                    <!-- Loading skeleton -->
                    <template v-if="loading">
                        <tr v-for="i in currentPageSize" :key="i">
                            <td v-if="enableSelection" :class="[densityCellCls, 'text-center']">
                                <div
                                    class="w-3.5 h-3.5 rounded mx-auto animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]" />
                            </td>
                            <td v-for="col in visibleColumns" :key="col.key" :class="densityCellCls">
                                <div class="h-3 rounded-full animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]"
                                    :style="{ width: (40 + (i * 13 + col.key.length * 7) % 45) + '%' }" />
                            </td>
                            <td v-if="$slots['row-actions']" :class="densityCellCls" />
                        </tr>
                    </template>

                    <!-- Error -->
                    <template v-else-if="error">
                        <tr>
                            <td :colspan="visibleColumns.length + (enableSelection ? 1 : 0) + ($slots['row-actions'] ? 1 : 0)"
                                class="px-4 py-10 text-center">
                                <div
                                    class="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center bg-rose-100 dark:bg-rose-950/40">
                                    <svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" stroke-width="1.75">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <p class="text-xs text-rose-500 font-medium">{{ error }}</p>
                            </td>
                        </tr>
                    </template>

                    <!-- Empty -->
                    <template v-else-if="filteredAndSorted.length === 0">
                        <tr>
                            <td :colspan="visibleColumns.length + (enableSelection ? 1 : 0) + ($slots['row-actions'] ? 1 : 0)"
                                class="px-4 py-12 text-center">
                                <slot name="empty">
                                    <div
                                        class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]">
                                        <svg class="w-6 h-6 opacity-30 text-[rgb(var(--text-muted))]" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <p
                                        class="text-sm font-medium text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                        {{ emptyMessage }}</p>
                                    <p
                                        class="mt-1 text-xs text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                                        {{ emptySubMessage }}</p>
                                    <button v-if="searchQuery" @click="rawSearch = ''; searchQuery = ''"
                                        class="mt-3 text-xs text-primary-600 dark:text-primary-400 hover:underline">Limpar
                                        busca</button>
                                </slot>
                            </td>
                        </tr>
                    </template>

                    <!-- Data rows -->
                    <template v-else>
                        <tr v-for="row in paginatedRows" :key="row[rowKey]" :class="[
                            'transition-colors duration-100 cursor-pointer',
                            selectedKeys.has(row[rowKey]) ? 'bg-primary-50/60 dark:bg-primary-950/20' : 'hover:bg-[rgb(var(--bg-muted))/60%] dark:hover:bg-[rgb(var(--dark-bg-muted))/40%]',
                            rowClass ? rowClass(row) : '',
                        ]" @click="openDetail(row)">
                            <td v-if="enableSelection" :class="[densityCellCls, 'text-center w-10']" @click.stop>
                                <input type="checkbox" :checked="selectedKeys.has(row[rowKey])" @change="toggleRow(row)"
                                    class="w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer" />
                            </td>
                            <td v-for="col in visibleColumns" :key="col.key" :class="[
                                densityCellCls,
                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                                'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]',
                            ]">
                                <slot v-if="$slots[`cell-${col.key}`]" :name="`cell-${col.key}`" :value="row[col.key]"
                                    :row="row" :column="col" />
                                <template v-else-if="col.type === 'badge' && col.badgeMap">
                                    <span v-if="col.badgeMap[row[col.key]]"
                                        :class="['inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold', col.badgeMap[row[col.key]].class]">
                                        <span v-if="col.badgeMap[row[col.key]].dot"
                                            :class="['w-1.5 h-1.5 rounded-full', col.badgeMap[row[col.key]].dot]" />
                                        {{ col.badgeMap[row[col.key]].label }}
                                    </span>
                                    <span v-else class="text-[rgb(var(--text-muted))]">{{ row[col.key] ?? '—' }}</span>
                                </template>
                                <template v-else-if="col.type === 'boolean'">
                                    <span
                                        :class="['inline-flex items-center gap-1 text-[10px] font-medium',
                                            row[col.key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]']">
                                        <svg v-if="row[col.key]" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor" stroke-width="2.5">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor" stroke-width="2.5">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        {{ row[col.key] ? 'Sim' : 'Não' }}
                                    </span>
                                </template>
                                <template v-else>
                                    <span :class="['leading-snug', formatCell(col, row) === '—' ? 'opacity-30' : '']">
                                        {{ formatCell(col, row) }}
                                    </span>
                                </template>
                            </td>
                            <td v-if="$slots['row-actions']" :class="[densityCellCls, 'text-right w-12']" @click.stop>
                                <slot name="row-actions" :row="row" />
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- ══════════════════════════════════════════════════════════════ -->
        <!-- ── MOBILE CARDS — RecycleScroller (virtual DOM) ───────────── -->
        <!-- ══════════════════════════════════════════════════════════════ -->
        <div class="sm:hidden">
            <!-- Loading -->
            <template v-if="loading">
                <div v-for="i in Math.min(currentPageSize, 4)" :key="i"
                    class="p-4 space-y-3 border-b border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">
                    <div class="flex items-start gap-3">
                        <div v-if="enableSelection"
                            class="mt-0.5 w-3.5 h-3.5 rounded animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]" />
                        <div class="flex items-center gap-2.5 flex-1 min-w-0">
                            <div
                                class="w-8 h-8 rounded-full shrink-0 animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]" />
                            <div class="flex-1 space-y-2">
                                <div class="h-3 rounded-full animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]"
                                    :style="{ width: (45 + i * 11) + '%' }" />
                                <div
                                    class="h-2 w-28 rounded-full animate-pulse bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]" />
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Error -->
            <template v-else-if="error">
                <div class="px-4 py-10 text-center">
                    <div
                        class="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center bg-rose-100 dark:bg-rose-950/40">
                        <svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            stroke-width="1.75">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p class="text-xs text-rose-500 font-medium">{{ error }}</p>
                </div>
            </template>

            <!-- Empty -->
            <template v-else-if="filteredAndSorted.length === 0">
                <div class="px-4 py-12 text-center">
                    <slot name="empty">
                        <div
                            class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]">
                            <svg class="w-6 h-6 opacity-30 text-[rgb(var(--text-muted))]" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p
                            class="text-sm font-medium text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            {{ emptyMessage }}</p>
                        <p class="mt-1 text-xs text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">{{
                            emptySubMessage }}</p>
                        <button v-if="searchQuery" @click="rawSearch = ''; searchQuery = ''"
                            class="mt-3 text-xs text-primary-600 dark:text-primary-400 hover:underline">Limpar
                            busca</button>
                    </slot>
                </div>
            </template>

            <!-- ✅ RecycleScroller — só renderiza os cards visíveis na viewport -->
            <RecycleScroller v-else :items="paginatedRows" :item-size="mobileItemSize" :key-field="rowKey"
                class="mobile-scroller divide-y divide-[rgb(var(--color-primary-100))] dark:divide-[rgb(var(--color-primary-900))]"
                v-slot="{ item: row }">
                <div :class="[
                    'px-3 py-3.5 cursor-pointer transition-colors duration-100',
                    selectedKeys.has(row[rowKey])
                        ? 'bg-primary-50/60 dark:bg-primary-950/20'
                        : 'active:bg-[rgb(var(--bg-muted))/80%] dark:active:bg-[rgb(var(--dark-bg-muted))/60%]',
                    rowClass ? rowClass(row) : '',
                ]" @click="openDetail(row)">

                    <div class="flex items-start gap-2.5">
                        <div v-if="enableSelection" class="pt-0.5 shrink-0" @click.stop>
                            <input type="checkbox" :checked="selectedKeys.has(row[rowKey])" @change="toggleRow(row)"
                                class="w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer" />
                        </div>

                        <div class="flex-1 min-w-0">
                            <slot v-if="visibleColumns[0] && $slots[`cell-${visibleColumns[0].key}`]"
                                :name="`cell-${visibleColumns[0].key}`" :value="row[visibleColumns[0].key]" :row="row"
                                :column="visibleColumns[0]" />
                            <template v-else-if="visibleColumns[0]?.type === 'badge' && visibleColumns[0]?.badgeMap">
                                <span v-if="visibleColumns[0].badgeMap![row[visibleColumns[0].key]]" :class="['inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                    visibleColumns[0].badgeMap![row[visibleColumns[0].key]].class]">
                                    <span v-if="visibleColumns[0].badgeMap![row[visibleColumns[0].key]].dot"
                                        :class="['w-1.5 h-1.5 rounded-full', visibleColumns[0].badgeMap![row[visibleColumns[0].key]].dot]" />
                                    {{ visibleColumns[0].badgeMap![row[visibleColumns[0].key]].label }}
                                </span>
                                <span v-else class="text-sm text-[rgb(var(--text-muted))]">{{ row[visibleColumns[0].key]
                                    ?? '—' }}</span>
                            </template>
                            <template v-else-if="visibleColumns[0]?.type === 'boolean'">
                                <span
                                    :class="['text-sm font-medium', row[visibleColumns[0].key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-[rgb(var(--text-muted))]']">
                                    {{ row[visibleColumns[0].key] ? '✓ Sim' : '✗ Não' }}
                                </span>
                            </template>
                            <template v-else-if="visibleColumns[0]">
                                <span
                                    class="text-sm font-medium text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                    {{ formatCell(visibleColumns[0], row) }}
                                </span>
                            </template>
                        </div>

                        <div v-if="$slots['row-actions']" class="shrink-0 flex items-center" @click.stop>
                            <slot name="row-actions" :row="row" />
                        </div>
                        <svg v-else
                            class="w-4 h-4 mt-1 shrink-0 opacity-25 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>

                    <div v-if="visibleColumns.length > 1" class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3"
                        :class="enableSelection ? 'pl-6' : ''">
                        <div v-for="col in visibleColumns.slice(1)" :key="col.key" class="min-w-0">
                            <p class="text-[10px] font-semibold uppercase tracking-widest mb-1
                                      text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">{{
                                col.label }}</p>
                            <slot v-if="$slots[`cell-${col.key}`]" :name="`cell-${col.key}`" :value="row[col.key]"
                                :row="row" :column="col" />
                            <template v-else-if="col.type === 'badge' && col.badgeMap">
                                <span v-if="col.badgeMap[row[col.key]]"
                                    :class="['inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold', col.badgeMap[row[col.key]].class]">
                                    <span v-if="col.badgeMap[row[col.key]].dot"
                                        :class="['w-1.5 h-1.5 rounded-full', col.badgeMap[row[col.key]].dot]" />
                                    {{ col.badgeMap[row[col.key]].label }}
                                </span>
                                <span v-else class="text-xs text-[rgb(var(--text-muted))]">{{ row[col.key] ?? '—'
                                    }}</span>
                            </template>
                            <template v-else-if="col.type === 'boolean'">
                                <span
                                    :class="['inline-flex items-center gap-1 text-[10px] font-medium',
                                        row[col.key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]']">
                                    <svg v-if="row[col.key]" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" stroke-width="2.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" stroke-width="2.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    {{ row[col.key] ? 'Sim' : 'Não' }}
                                </span>
                            </template>
                            <template v-else>
                                <span :class="['text-xs font-medium leading-snug',
                                    formatCell(col, row) === '—' ? 'opacity-30' : '',
                                    'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]']">
                                    {{ formatCell(col, row) }}
                                </span>
                            </template>
                        </div>
                    </div>
                </div>
            </RecycleScroller>
        </div>

        <!-- ── PAGINATION ────────────────────────────────────── -->
        <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-t
                    border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]
                    bg-[rgb(var(--bg-muted))/50%] dark:bg-[rgb(var(--dark-bg-muted))/30%]">
            <div class="flex items-center gap-2">
                <span
                    class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">Linhas</span>
                <select v-model="currentPageSize" class="select-arrow h-7 pl-2 pr-6 rounded-lg text-[11px] font-medium appearance-none cursor-pointer
                           outline-none transition-all
                           bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                           text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                           border border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]
                           hover:border-primary-300 dark:hover:border-primary-700
                           focus:border-primary-400 dark:focus:border-primary-600">
                    <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}</option>
                </select>
            </div>

            <span
                class="text-[10px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] order-last sm:order-none">
                {{ fromRow }}–{{ toRow }} de {{ totalRows }}
            </span>

            <div class="flex items-center gap-1">
                <button @click="currentPage--" :disabled="currentPage === 1" class="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                           transition-all disabled:opacity-40 disabled:cursor-not-allowed
                           text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                           hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
                           disabled:hover:bg-transparent">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span class="hidden sm:inline">Anterior</span>
                </button>

                <template v-for="page in visiblePages" :key="page ?? `d${Math.random()}`">
                    <span v-if="page === null"
                        class="w-6 text-center text-[11px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">…</span>
                    <button v-else @click="currentPage = page" :class="[
                        'w-7 h-7 rounded-lg text-[11px] font-medium transition-all',
                        currentPage === page
                            ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                            : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]'
                    ]">{{ page }}</button>
                </template>

                <button @click="currentPage++" :disabled="currentPage === totalPages" class="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                           transition-all disabled:opacity-40 disabled:cursor-not-allowed
                           text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                           hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
                           disabled:hover:bg-transparent">
                    <span class="hidden sm:inline">Próxima</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- ── DETAIL MODAL — Teleport com v-if: desmonta quando fechado ── -->
    <!-- 🚀 OPTIMIZATION 5: Teleport só existe no DOM quando detailRow !== null -->
    <Teleport v-if="detailRow" to="body">
        <Transition name="float-overlay" appear>
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">

                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/20 backdrop-blur-[3px]" @click="closeDetail" />

                <!-- Card -->
                <Transition name="float-card" appear>
                    <div
                        class="float-card relative z-10 w-full sm:w-[680px] flex flex-col
                               max-h-[90vh] rounded-3xl overflow-hidden shadow-float
                               bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                               border border-[rgb(var(--color-primary-100))] dark:border-[rgb(var(--color-primary-900))]">

                        <!-- Close bar -->
                        <div class="flex-shrink-0 flex items-center justify-end px-4 py-3">
                            <button @click="closeDetail"
                                class="w-7 h-7 rounded-xl flex items-center justify-center transition-all
                                       text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                                       hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
                                       hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    stroke-width="2.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <!-- Content (scrollable) -->
                        <div class="flex-1 overflow-y-auto overscroll-contain">
                            <slot name="detail" :row="detailRow" :close="closeDetail">
                                <AppDetailViewer :data="detailRow" :schema="resolvedColumns"
                                    :subtitle="`ID: ${String(detailRow[rowKey]).slice(0, 12).toUpperCase()}`" />
                            </slot>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.select-arrow {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 4px center;
    background-repeat: no-repeat;
    background-size: 16px 16px;
}

/* ── Mobile scroller — altura máxima para virtualização funcionar ── */
.mobile-scroller {
    max-height: 600px;
    overflow-y: auto;
}

/* ── Floating card shadow ───────────────────────────────── */
.shadow-float {
    box-shadow:
        0 0 0 1px rgb(var(--color-primary-100) / 0.6),
        0 8px 32px -4px rgb(var(--color-primary-300) / 0.25),
        0 32px 64px -12px rgb(0 0 0 / 0.18),
        0 2px 8px -1px rgb(0 0 0 / 0.08);
}

.dark .shadow-float {
    box-shadow:
        0 0 0 1px rgb(var(--color-primary-900) / 0.8),
        0 8px 32px -4px rgb(0 0 0 / 0.4),
        0 32px 64px -12px rgb(0 0 0 / 0.5),
        0 2px 8px -1px rgb(0 0 0 / 0.3);
}

/* ── Overlay transition ─────────────────────────────────── */
.float-overlay-enter-active {
    transition: opacity 0.2s ease;
}

.float-overlay-leave-active {
    transition: opacity 0.18s ease;
}

.float-overlay-enter-from,
.float-overlay-leave-to {
    opacity: 0;
}

/* ── Card transition ────────────────────────────────────── */
.float-card-enter-active {
    transition: opacity 0.28s ease, transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.float-card-leave-active {
    transition: opacity 0.18s ease, transform 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.float-card-enter-from,
.float-card-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
}

/* ── Toolbar / search transitions ───────────────────────── */
.swap-enter-active,
.swap-leave-active {
    transition: all 0.2s ease;
}

.swap-enter-from {
    opacity: 0;
    transform: translateY(-4px);
}

.swap-leave-to {
    opacity: 0;
    transform: translateY(4px);
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

.dropdown-enter-active {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-leave-active {
    transition: all 0.12s ease-in;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-6px) scale(0.97);
}

/* ── Scrollbars ─────────────────────────────────────────── */
::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: rgb(var(--color-primary-200));
    border-radius: 9999px;
}
</style>
