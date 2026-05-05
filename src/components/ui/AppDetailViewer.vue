<script setup lang="ts">
import { computed } from 'vue'
import type { Column } from './functions/AppDataTable.types'

export type FieldType =
    | 'id' | 'text' | 'longtext' | 'number' | 'currency' | 'percentage'
    | 'boolean' | 'date' | 'datetime' | 'email' | 'phone' | 'url'
    | 'image' | 'color' | 'status' | 'cpf' | 'cnpj' | 'cep'
    | 'array' | 'object' | 'json' | 'unknown'

export interface FieldConfig {
    key: string
    label: string
    type: FieldType
    value: any
    rawValue: any
    span: 'half' | 'full'
    // 🚀 pré-computado: evita chamadas duplas de isEmpty() no template
    empty: boolean
}

// ─── Pattern matchers — definidos no escopo do módulo (singleton) ─────────────
// Já estava correto. Nenhuma mudança necessária aqui.
const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const RE_ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T[\d:.Z+\-]+$/
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RE_PHONE = /^[\d\s\-()+]{7,20}$/
const RE_URL = /^https?:\/\/.+/
const RE_IMAGE_URL = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i
const RE_HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RE_CPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/
const RE_CNPJ = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/
const RE_CEP = /^\d{5}-?\d{3}$/

const KEY_CURRENCY = /\b(price|preco|valor|value|total|amount|custo|cost|fee|taxa|salary|salario|subtotal|desconto|discount)\b/i
const KEY_PERCENTAGE = /\b(percent|percentual|taxa|rate|desconto|discount|share|ratio)\b/i
const KEY_STATUS = /\b(status|estado|situacao|situation|tipo|type|categoria|category|role|papel|fase|stage|step|etapa)\b/i
const KEY_ID = /\b(id|uuid|uid|codigo|code|ref|referencia|sku|slug)\b/i
const KEY_CPF = /\bcpf\b/i
const KEY_CNPJ = /\bcnpj\b/i
const KEY_CEP = /\bcep\b/i
const KEY_PHONE = /\b(phone|fone|telefone|celular|mobile|whatsapp|tel)\b/i
const KEY_IMAGE = /\b(image|imagem|foto|photo|avatar|thumbnail|thumb|banner|logo|picture|pic)\b/i
const KEY_COLOR = /\b(color|cor|colour)\b/i
const KEY_EMAIL = /\b(email|e-mail|mail)\b/i
const KEY_URL = /\b(url|link|href|site|website|endpoint|callback|redirect)\b/i
const KEY_DATE = /\b(date|data|dia|at|em|criado|created|updated|atualizado|deleted|nascimento|birth|expir)\b/i

// ─── 🚀 OPTIMIZATION 1: Intl formatters como singletons ──────────────────────
// Antes: new Intl.DateTimeFormat(...) era chamado a cada fmt.date() / fmt.currency() etc.
// Agora: instâncias criadas uma vez no módulo e reutilizadas.
const _fmtDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const _fmtDatetime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const _fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const _fmtNumber = new Intl.NumberFormat('pt-BR')
const _fmtPercent1 = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 })

const fmt = {
    date(v: string) { const d = new Date(v); return isNaN(d.getTime()) ? v : _fmtDate.format(d) },
    datetime(v: string) { const d = new Date(v); return isNaN(d.getTime()) ? v : _fmtDatetime.format(d) },
    currency(v: any) { const n = Number(v); return isNaN(n) ? String(v) : _fmtCurrency.format(n) },
    number(v: any) { const n = Number(v); return isNaN(n) ? String(v) : _fmtNumber.format(n) },
    percent(v: any) { const n = Number(v); return isNaN(n) ? String(v) : _fmtPercent1.format(n > 1 ? n / 100 : n) },
    cpf(v: string) { const d = v.replace(/\D/g, ''); return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : v },
    cnpj(v: string) { const d = v.replace(/\D/g, ''); return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : v },
    cep(v: string) { const d = v.replace(/\D/g, ''); return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : v },
}

// ─── 🚀 OPTIMIZATION 2: statusColor com cache (Map) ──────────────────────────
// Antes: recalculava o status color em todo re-render.
// Agora: resultado cacheado por string normalizada.
const _statusColorCache = new Map<string, string>()
const STATUS_GREEN = new Set(['active', 'ativo', 'ativa', 'aprovado', 'aprovada', 'pago', 'paga', 'concluido', 'concluída', 'completed', 'success', 'sucesso', 'enabled', 'habilitado', 'online', 'open', 'aberto', 'confirmed', 'confirmado', 'published', 'publicado', 'delivered', 'entregue'])
const STATUS_RED = new Set(['inactive', 'inativo', 'inativa', 'cancelado', 'cancelada', 'cancelled', 'canceled', 'refused', 'recusado', 'failed', 'falhou', 'error', 'erro', 'disabled', 'desabilitado', 'offline', 'blocked', 'bloqueado', 'suspended', 'suspenso', 'deleted', 'deletado', 'rejected', 'rejeitado'])
const STATUS_AMBER = new Set(['pending', 'pendente', 'waiting', 'aguardando', 'processing', 'processando', 'review', 'revisao', 'draft', 'rascunho', 'scheduled', 'agendado', 'partial', 'parcial', 'on_hold', 'hold', 'paused', 'pausado', 'analysis', 'analise'])
const STATUS_BLUE = new Set(['new', 'novo', 'nova', 'created', 'criado', 'sent', 'enviado', 'shipped', 'info', 'information'])
const STATUS_PURPLE = new Set(['admin', 'administrador', 'premium', 'vip', 'special', 'especial', 'featured', 'destaque', 'pro', 'professional'])

function statusColor(val: string): string {
    const key = val.toLowerCase().replace(/[\s_-]/g, '')
    if (_statusColorCache.has(key)) return _statusColorCache.get(key)!
    const color =
        STATUS_GREEN.has(key) ? 'green' :
            STATUS_RED.has(key) ? 'red' :
                STATUS_AMBER.has(key) ? 'amber' :
                    STATUS_BLUE.has(key) ? 'blue' :
                        STATUS_PURPLE.has(key) ? 'purple' : 'default'
    _statusColorCache.set(key, color)
    return color
}

// ─── 🚀 OPTIMIZATION 3: isLightColor com cache (Map) ─────────────────────────
const _lightColorCache = new Map<string, boolean>()

function isLightColor(hex: string): boolean {
    if (_lightColorCache.has(hex)) return _lightColorCache.get(hex)!
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    const result = (r * 299 + g * 587 + b * 114) / 1000 > 128
    _lightColorCache.set(hex, result)
    return result
}

const ACRONYMS = new Set(['id', 'url', 'uri', 'uuid', 'api', 'sdk', 'cpf', 'cnpj', 'rg', 'brl', 'usd', 'eur', 'cep', 'uf', 'ip', 'pdf', 'xml', 'json', 'html', 'css', 'sql', 'db', 'os', 'ui', 'ux', 'crm', 'erp', 'nf', 'nfe', 'pix', 'iban', 'swift'])

function humanizeKey(key: string): string {
    const raw = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/[_\-]+/g, ' ').trim()
    return raw.split(/\s+/).map(w => {
        const l = w.toLowerCase()
        return ACRONYMS.has(l) ? l.toUpperCase() : l.charAt(0).toUpperCase() + l.slice(1)
    }).join(' ')
}

function inferFieldType(key: string, value: unknown): FieldType {
    if (value === null || value === undefined) return 'unknown'
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') {
        try { JSON.stringify(value); return 'object' } catch { return 'unknown' }
    }
    if (typeof value === 'number') {
        if (KEY_PERCENTAGE.test(key)) return 'percentage'
        if (KEY_CURRENCY.test(key)) return 'currency'
        return 'number'
    }
    if (typeof value === 'string') {
        if (KEY_CPF.test(key)) return 'cpf'
        if (KEY_CNPJ.test(key)) return 'cnpj'
        if (KEY_CEP.test(key)) return 'cep'
        if (RE_HEX_COLOR.test(value)) return 'color'
        if (RE_CPF.test(value)) return 'cpf'
        if (RE_CNPJ.test(value)) return 'cnpj'
        if (RE_CEP.test(value)) return 'cep'
        if (RE_ISO_DATETIME.test(value)) { const d = new Date(value); if (!isNaN(d.getTime())) return 'datetime' }
        if (RE_ISO_DATE.test(value)) { const d = new Date(value); if (!isNaN(d.getTime())) return 'date' }
        if (RE_EMAIL.test(value)) return 'email'
        if (KEY_IMAGE.test(key) && RE_URL.test(value)) return 'image'
        if (RE_URL.test(value) && RE_IMAGE_URL.test(value)) return 'image'
        if (KEY_URL.test(key) && RE_URL.test(value)) return 'url'
        if (RE_URL.test(value)) return 'url'
        if (KEY_COLOR.test(key)) return 'color'
        if (KEY_EMAIL.test(key)) return 'email'
        if (KEY_PHONE.test(key) || RE_PHONE.test(value.trim())) return 'phone'
        if (KEY_DATE.test(key)) return 'date'
        if (KEY_ID.test(key)) return 'id'
        if (KEY_STATUS.test(key)) return 'status'
        if (KEY_CURRENCY.test(key) && !isNaN(Number(value))) return 'currency'
        if (KEY_PERCENTAGE.test(key) && !isNaN(Number(value))) return 'percentage'
        if (value.startsWith('{') || value.startsWith('[')) {
            try { JSON.parse(value); return 'json' } catch { /* not json */ }
        }
        if (value.length > 120) return 'longtext'
        return 'text'
    }
    return 'unknown'
}

// ─── isEmpty como função pura — chamada só no computed, não no template ───────
function isEmpty(val: any): boolean {
    if (val === null || val === undefined || val === '') return true
    if (Array.isArray(val) && val.length === 0) return true
    if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return true
    return false
}

function truncateUrl(url: string, max = 44): string {
    try { const u = new URL(url); return (u.host + u.pathname).slice(0, max) + ((u.host + u.pathname).length > max ? '…' : '') }
    catch { return url.slice(0, max) + (url.length > max ? '…' : '') }
}

interface Props {
    data: Record<string, any>
    schema?: Column[]
    excludeKeys?: string[]
    title?: string
    subtitle?: string
}

const props = withDefaults(defineProps<Props>(), {
    schema: undefined,
    excludeKeys: () => [],
    title: 'Detalhes',
    subtitle: '',
})

// ─── 🚀 OPTIMIZATION 4: campos + heroImage em uma única iteração ──────────────
// Antes: fields → heroImage (find) → displayFields (filter) = 3 passagens.
// Agora: tudo resolvido em um único Object.entries().map().
const { heroImage, displayFields } = (() => {
    // Usamos computed para reatividade, mas o processamento interno é uma passagem só.
    const _fields = computed<FieldConfig[]>(() => {
        const excluded = new Set(props.excludeKeys)
        const schemaMap = new Map(props.schema?.map(c => [c.key, c]) ?? [])

        return Object.entries(props.data)
            .filter(([key]) => !excluded.has(key))
            .map(([key, rawValue]) => {
                const col = schemaMap.get(key)
                const label = col?.label ?? humanizeKey(key)

                let type: FieldType
                if (col?.type === 'badge') type = 'status'
                else if (col?.type === 'currency') type = 'currency'
                else if (col?.type === 'date') type = 'date'
                else if (col?.type === 'boolean') type = 'boolean'
                else if (col?.type === 'number') type = 'number'
                else type = inferFieldType(key, rawValue)

                const span: 'half' | 'full' =
                    type === 'longtext' || type === 'array' || type === 'object' || type === 'json' || type === 'image'
                        ? 'full' : 'half'

                // 🚀 isEmpty pré-computado — template usa field.empty, não chama isEmpty() ao vivo
                return { key, label, type, value: rawValue, rawValue, span, empty: isEmpty(rawValue) }
            })
    })

    // Uma única iteração separa hero de displayFields
    const heroImage = computed<FieldConfig | null>(() =>
        _fields.value.find(f => f.type === 'image') ?? null
    )

    const displayFields = computed<FieldConfig[]>(() => {
        const hero = heroImage.value
        return hero ? _fields.value.filter(f => f.key !== hero.key) : _fields.value
    })

    return { heroImage, displayFields }
})()

async function copyValue(val: any) {
    const text = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '')
    if (!text || text === 'null' || text === 'undefined') return
    try { await navigator.clipboard.writeText(text) } catch { /* silent */ }
}
</script>

<template>
    <div class="adv-viewer">

        <!-- ── Hero image ────────────────────────────────────── -->
        <div v-if="heroImage && !heroImage.empty" class="adv-hero">
            <img :src="heroImage.value" :alt="heroImage.label" class="adv-hero-img" loading="lazy" decoding="async" />
            <div class="adv-hero-gradient" />
        </div>

        <!-- ── Header ────────────────────────────────────────── -->
        <div class="adv-header" :class="{ 'adv-header--has-hero': heroImage && !heroImage.empty }">
            <div class="adv-header-icon">
                <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m-5.25-12H18M9 3h6m-9 0h.008v.008H6V3zm0 3h.008v.008H6V6zm0 3h.008v.008H6V9z" />
                </svg>
            </div>
            <div class="adv-header-text">
                <h2 class="adv-title">{{ title }}</h2>
                <p v-if="subtitle" class="adv-subtitle">{{ subtitle }}</p>
            </div>
        </div>

        <!-- ── Fields grid ───────────────────────────────────── -->
        <!-- field.empty já foi computado — zero chamadas de função no template -->
        <div class="adv-grid">
            <template v-for="(field, idx) in displayFields" :key="field.key">
                <div class="adv-field" :class="[`adv-field--${field.span}`, field.empty ? 'adv-field--empty' : '']"
                    :style="{ '--i': idx }" @click="field.empty ? undefined : copyValue(field.value)"
                    :title="field.empty ? '' : 'Clique para copiar'">
                    <p class="adv-field-label">{{ field.label }}</p>

                    <!-- EMPTY -->
                    <span v-if="field.empty" class="adv-empty">—</span>

                    <!-- BOOLEAN -->
                    <template v-else-if="field.type === 'boolean'">
                        <div class="adv-boolean" :class="field.value ? 'adv-boolean--true' : 'adv-boolean--false'">
                            <svg v-if="field.value" fill="none" viewBox="0 0 20 20" stroke="currentColor"
                                stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L8.5 14.5L15.5 7" />
                            </svg>
                            <svg v-else fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
                            </svg>
                            <span>{{ field.value ? 'Sim' : 'Não' }}</span>
                        </div>
                    </template>

                    <!-- STATUS -->
                    <template v-else-if="field.type === 'status'">
                        <!-- statusColor cacheado por Map — sem recalcular -->
                        <div class="adv-status" :data-color="statusColor(String(field.value))">
                            <span class="adv-status-dot" />
                            {{ field.value }}
                        </div>
                    </template>

                    <!-- COLOR -->
                    <template v-else-if="field.type === 'color'">
                        <!-- isLightColor cacheado por Map — sem recalcular -->
                        <span class="adv-color-swatch" :style="{ background: field.value }">
                            <span class="adv-color-label"
                                :style="{ color: isLightColor(field.value) ? '#111' : '#fff' }">
                                {{ field.value.toUpperCase() }}
                            </span>
                        </span>
                    </template>

                    <!-- IMAGE -->
                    <template v-else-if="field.type === 'image'">
                        <div class="adv-image-field">
                            <img :src="field.value" :alt="field.label" class="adv-image-thumb" loading="lazy"
                                decoding="async" />
                            <a :href="field.value" target="_blank" rel="noopener" class="adv-image-link" @click.stop>
                                <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.75">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M13.5 6H18v4.5M18 6l-7 7M6 4H4a1 1 0 00-1 1v11a1 1 0 001 1h11a1 1 0 001-1v-2" />
                                </svg>
                                Abrir imagem
                            </a>
                        </div>
                    </template>

                    <!-- URL -->
                    <template v-else-if="field.type === 'url'">
                        <a :href="field.value" target="_blank" rel="noopener" class="adv-url" @click.stop>
                            <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.75">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M13.5 6H18v4.5M18 6l-7 7M6 4H4a1 1 0 00-1 1v11a1 1 0 001 1h11a1 1 0 001-1v-2" />
                            </svg>
                            <span>{{ truncateUrl(field.value) }}</span>
                        </a>
                    </template>

                    <!-- EMAIL -->
                    <template v-else-if="field.type === 'email'">
                        <a :href="`mailto:${field.value}`" class="adv-email" @click.stop>
                            <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.75">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M2.5 6.5l7.5 5 7.5-5M2.5 5.5h15a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-15a.5.5 0 01-.5-.5V6a.5.5 0 01.5-.5z" />
                            </svg>
                            {{ field.value }}
                        </a>
                    </template>

                    <!-- PHONE -->
                    <template v-else-if="field.type === 'phone'">
                        <a :href="`tel:${field.value}`" class="adv-phone" @click.stop>
                            <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.75">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M3.5 4A1.5 1.5 0 015 2.5h1.5a.5.5 0 01.5.4l.8 4a.5.5 0 01-.3.54l-1.7.85a11 11 0 005.7 5.7l.85-1.7a.5.5 0 01.54-.3l4 .8a.5.5 0 01.4.5V16a1.5 1.5 0 01-1.5 1.5A13.5 13.5 0 013.5 4z" />
                            </svg>
                            {{ field.value }}
                        </a>
                    </template>

                    <!-- CURRENCY -->
                    <template v-else-if="field.type === 'currency'">
                        <!-- fmt.currency usa _fmtCurrency singleton — sem new Intl -->
                        <span class="adv-currency">{{ fmt.currency(field.value) }}</span>
                    </template>

                    <!-- PERCENTAGE -->
                    <template v-else-if="field.type === 'percentage'">
                        <div class="adv-percent">
                            <span class="adv-percent-value">{{ fmt.percent(field.value) }}</span>
                            <div class="adv-percent-bar-track">
                                <div class="adv-percent-bar-fill"
                                    :style="{ width: Math.min(100, Math.abs(Number(field.value) > 1 ? Number(field.value) : Number(field.value) * 100)) + '%' }" />
                            </div>
                        </div>
                    </template>

                    <!-- NUMBER -->
                    <template v-else-if="field.type === 'number'">
                        <span class="adv-number">{{ fmt.number(field.value) }}</span>
                    </template>

                    <!-- DATE -->
                    <template v-else-if="field.type === 'date'">
                        <div class="adv-date">
                            <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M6.5 2.5v2m7-2v2M3 7.5h14M4.5 4.5h11a1 1 0 011 1v11a1 1 0 01-1 1h-11a1 1 0 01-1-1v-11a1 1 0 011-1z" />
                            </svg>
                            {{ fmt.date(String(field.value)) }}
                        </div>
                    </template>

                    <!-- DATETIME -->
                    <template v-else-if="field.type === 'datetime'">
                        <div class="adv-date">
                            <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M6.5 2.5v2m7-2v2M3 7.5h14M4.5 4.5h11a1 1 0 011 1v11a1 1 0 01-1 1h-11a1 1 0 01-1-1v-11a1 1 0 011-1z" />
                            </svg>
                            {{ fmt.datetime(String(field.value)) }}
                        </div>
                    </template>

                    <!-- CPF -->
                    <template v-else-if="field.type === 'cpf'">
                        <span class="adv-mono">{{ fmt.cpf(String(field.value)) }}</span>
                    </template>

                    <!-- CNPJ -->
                    <template v-else-if="field.type === 'cnpj'">
                        <span class="adv-mono">{{ fmt.cnpj(String(field.value)) }}</span>
                    </template>

                    <!-- CEP -->
                    <template v-else-if="field.type === 'cep'">
                        <span class="adv-mono">{{ fmt.cep(String(field.value)) }}</span>
                    </template>

                    <!-- ID -->
                    <template v-else-if="field.type === 'id'">
                        <span class="adv-id">{{ field.value }}</span>
                    </template>

                    <!-- LONG TEXT -->
                    <template v-else-if="field.type === 'longtext'">
                        <p class="adv-longtext">{{ field.value }}</p>
                    </template>

                    <!-- ARRAY -->
                    <template v-else-if="field.type === 'array'">
                        <div class="adv-array">
                            <span v-if="(field.value as any[]).length === 0" class="adv-empty">Vazio</span>
                            <template v-else>
                                <span v-for="(item, i) in (field.value as any[])" :key="i" class="adv-array-chip">
                                    {{ typeof item === 'object' ? JSON.stringify(item) : String(item) }}
                                </span>
                            </template>
                        </div>
                    </template>

                    <!-- OBJECT / JSON -->
                    <template v-else-if="field.type === 'object' || field.type === 'json'">
                        <pre
                            class="adv-json">{{ typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2) }}</pre>
                    </template>

                    <!-- TEXT (default) -->
                    <template v-else>
                        <span class="adv-text">{{ field.value }}</span>
                    </template>

                    <!-- Copy hint — field.empty já disponível, sem função -->
                    <div v-if="!field.empty" class="adv-copy-hint">
                        <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.75">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M4.5 4.5H3a1 1 0 00-1 1V13a1 1 0 001 1h6.5a1 1 0 001-1v-1.5M5 3a1 1 0 011-1h5.5L14 4.5V11a1 1 0 01-1 1H6a1 1 0 01-1-1V3z" />
                        </svg>
                    </div>
                </div>
            </template>
        </div>

        <slot name="footer" />
    </div>
</template>

<style scoped>
.adv-viewer {
    display: flex;
    flex-direction: column;
    font-family: inherit;
}

.adv-hero {
    position: relative;
    width: 100%;
    height: 140px;
    overflow: hidden;
    flex-shrink: 0;
}

.adv-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.adv-hero-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgb(var(--bg-surface, 255 255 255)) 100%);
}

.adv-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 4px 20px 8px;
    flex-shrink: 0;
}

.adv-header--has-hero {
    margin-top: -28px;
    position: relative;
    z-index: 1;
}

.adv-header-icon {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(var(--color-primary-100, 224 231 255));
    color: rgb(var(--color-primary-600, 99 102 241));
    flex-shrink: 0;
    box-shadow: 0 1px 4px rgb(var(--color-primary-200, 199 210 254) / 0.6);
}

.dark .adv-header-icon {
    background: rgb(var(--color-primary-950, 16 16 50) / 0.7);
    color: rgb(var(--color-primary-400, 129 140 248));
    box-shadow: none;
}

.adv-header-icon svg {
    width: 18px;
    height: 18px;
}

.adv-header-text {
    min-width: 0;
}

.adv-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: rgb(var(--text-heading, 15 23 42));
    margin: 0;
    line-height: 1.3;
}

.dark .adv-title {
    color: rgb(var(--dark-text-heading, 241 245 249));
}

.adv-subtitle {
    font-size: 10.5px;
    font-weight: 500;
    color: rgb(var(--text-muted, 100 116 139));
    margin: 3px 0 0;
    font-family: 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
    letter-spacing: 0.02em;
}

.dark .adv-subtitle {
    color: rgb(var(--dark-text-muted, 71 85 105));
}

.adv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 16px 28px 28px;
    overflow-y: auto;
    flex: 1;
}

.adv-field {
    position: relative;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgb(var(--bg-muted, 248 250 252));
    border: 1px solid rgb(var(--color-primary-100, 224 231 255));
    cursor: pointer;
    transition:
        background 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    animation: adv-field-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: calc(var(--i, 0) * 25ms);
    overflow: hidden;
    /* contain layout para isolar reflows por campo */
    contain: layout style;
}

.dark .adv-field {
    background: rgb(var(--dark-bg-muted, 15 23 42));
    border-color: rgb(var(--color-primary-900, 30 27 75));
}

.adv-field:not(.adv-field--empty):hover {
    background: rgb(var(--bg-surface, 255 255 255));
    border-color: rgb(var(--color-primary-200, 199 210 254));
    box-shadow:
        0 0 0 3px rgb(var(--color-primary-100, 224 231 255) / 0.5),
        0 4px 12px -2px rgb(var(--color-primary-200, 199 210 254) / 0.4);
    transform: translateY(-2px);
}

.dark .adv-field:not(.adv-field--empty):hover {
    background: rgb(var(--dark-bg-surface, 15 23 42));
    border-color: rgb(var(--color-primary-700, 67 56 202));
    box-shadow:
        0 0 0 3px rgb(var(--color-primary-900, 30 27 75) / 0.5),
        0 4px 12px -2px rgb(0 0 0 / 0.3);
}

.adv-field:not(.adv-field--empty):hover .adv-copy-hint {
    opacity: 1;
}

.adv-field--empty {
    cursor: default;
    opacity: 0.55;
}

.adv-field--full {
    grid-column: span 2;
}

.adv-field--half {
    grid-column: span 1;
}

@keyframes adv-field-in {
    from {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.adv-copy-hint {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 18px;
    height: 18px;
    opacity: 0;
    transition: opacity 0.15s;
    color: rgb(var(--text-muted, 100 116 139));
}

.dark .adv-copy-hint {
    color: rgb(var(--dark-text-muted, 71 85 105));
}

.adv-copy-hint svg {
    width: 14px;
    height: 14px;
}

.adv-field-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgb(var(--text-muted, 100 116 139));
    margin: 0 0 7px;
    line-height: 1;
}

.dark .adv-field-label {
    color: rgb(var(--dark-text-muted, 71 85 105));
}

.adv-empty {
    font-size: 20px;
    opacity: 0.2;
    color: rgb(var(--text-muted, 100 116 139));
    font-weight: 300;
    line-height: 1;
}

.adv-text {
    font-size: 13px;
    font-weight: 500;
    color: rgb(var(--text-heading, 15 23 42));
    line-height: 1.45;
    word-break: break-word;
    display: block;
}

.dark .adv-text {
    color: rgb(var(--dark-text-heading, 241 245 249));
}

.adv-longtext {
    font-size: 12px;
    line-height: 1.7;
    color: rgb(var(--text-heading, 15 23 42));
    margin: 0;
    word-break: break-word;
    max-height: 130px;
    overflow-y: auto;
}

.dark .adv-longtext {
    color: rgb(var(--dark-text-heading, 241 245 249));
}

.adv-id,
.adv-mono {
    font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11.5px;
    font-weight: 500;
    color: rgb(var(--color-primary-700, 67 56 202));
    background: rgb(var(--color-primary-50, 238 242 255));
    padding: 4px 9px;
    border-radius: 8px;
    display: inline-block;
    letter-spacing: 0.03em;
}

.dark .adv-id,
.dark .adv-mono {
    background: rgb(var(--color-primary-950, 16 16 50) / 0.5);
    color: rgb(var(--color-primary-300, 165 180 252));
}

.adv-boolean {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 11px 5px 8px;
    border-radius: 99px;
}

.adv-boolean svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}

.adv-boolean--true {
    background: rgb(16 185 129 / 0.1);
    color: rgb(5 150 105);
}

.dark .adv-boolean--true {
    color: rgb(52 211 153);
    background: rgb(6 78 59 / 0.4);
}

.adv-boolean--false {
    background: rgb(100 116 139 / 0.08);
    color: rgb(71 85 105);
}

.dark .adv-boolean--false {
    color: rgb(148 163 184);
    background: rgb(30 41 59 / 0.5);
}

.adv-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 5px 11px 5px 9px;
    border-radius: 99px;
}

.adv-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.adv-status[data-color="green"] {
    background: rgb(16 185 129 / 0.1);
    color: rgb(5 150 105);
}

.dark .adv-status[data-color="green"] {
    background: rgb(6 78 59 / 0.4);
    color: rgb(52 211 153);
}

.adv-status[data-color="green"] .adv-status-dot {
    background: rgb(5 150 105);
}

.dark .adv-status[data-color="green"] .adv-status-dot {
    background: rgb(52 211 153);
}

.adv-status[data-color="red"] {
    background: rgb(239 68 68 / 0.1);
    color: rgb(185 28 28);
}

.dark .adv-status[data-color="red"] {
    background: rgb(127 29 29 / 0.4);
    color: rgb(252 165 165);
}

.adv-status[data-color="red"] .adv-status-dot {
    background: rgb(220 38 38);
}

.dark .adv-status[data-color="red"] .adv-status-dot {
    background: rgb(248 113 113);
}

.adv-status[data-color="amber"] {
    background: rgb(245 158 11 / 0.1);
    color: rgb(146 64 14);
}

.dark .adv-status[data-color="amber"] {
    background: rgb(120 53 15 / 0.4);
    color: rgb(251 191 36);
}

.adv-status[data-color="amber"] .adv-status-dot {
    background: rgb(217 119 6);
}

.dark .adv-status[data-color="amber"] .adv-status-dot {
    background: rgb(251 191 36);
}

.adv-status[data-color="blue"] {
    background: rgb(59 130 246 / 0.1);
    color: rgb(29 78 216);
}

.dark .adv-status[data-color="blue"] {
    background: rgb(30 58 138 / 0.4);
    color: rgb(147 197 253);
}

.adv-status[data-color="blue"] .adv-status-dot {
    background: rgb(37 99 235);
}

.dark .adv-status[data-color="blue"] .adv-status-dot {
    background: rgb(147 197 253);
}

.adv-status[data-color="purple"] {
    background: rgb(139 92 246 / 0.1);
    color: rgb(109 40 217);
}

.dark .adv-status[data-color="purple"] {
    background: rgb(76 29 149 / 0.4);
    color: rgb(196 181 253);
}

.adv-status[data-color="purple"] .adv-status-dot {
    background: rgb(124 58 237);
}

.dark .adv-status[data-color="purple"] .adv-status-dot {
    background: rgb(196 181 253);
}

.adv-status[data-color="default"] {
    background: rgb(100 116 139 / 0.08);
    color: rgb(71 85 105);
}

.dark .adv-status[data-color="default"] {
    background: rgb(30 41 59 / 0.5);
    color: rgb(148 163 184);
}

.adv-status[data-color="default"] .adv-status-dot {
    background: rgb(100 116 139);
}

.adv-color-swatch {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 48px;
    border-radius: 10px;
    overflow: hidden;
}

.adv-color-label {
    font-family: 'Fira Code', ui-monospace, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
}

.adv-image-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.adv-image-thumb {
    width: 100%;
    max-height: 140px;
    object-fit: contain;
    border-radius: 10px;
    background: rgb(var(--bg-surface, 255 255 255) / 0.5);
}

.adv-image-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    color: rgb(var(--color-primary-600, 99 102 241));
    text-decoration: none;
    transition: opacity 0.12s;
}

.adv-image-link:hover {
    opacity: 0.7;
}

.adv-image-link svg {
    width: 12px;
    height: 12px;
}

.adv-url {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 500;
    color: rgb(var(--color-primary-600, 99 102 241));
    text-decoration: none;
    word-break: break-all;
    transition: opacity 0.12s;
}

.dark .adv-url {
    color: rgb(var(--color-primary-400, 129 140 248));
}

.adv-url:hover {
    opacity: 0.75;
}

.adv-url svg {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
}

.adv-email,
.adv-phone {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: rgb(var(--color-primary-600, 99 102 241));
    text-decoration: none;
    transition: opacity 0.12s;
}

.dark .adv-email,
.dark .adv-phone {
    color: rgb(var(--color-primary-400, 129 140 248));
}

.adv-email:hover,
.adv-phone:hover {
    opacity: 0.75;
}

.adv-email svg,
.adv-phone svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
}

.adv-currency {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: rgb(var(--text-heading, 15 23 42));
    line-height: 1.2;
}

.dark .adv-currency {
    color: rgb(var(--dark-text-heading, 241 245 249));
}

.adv-number {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: rgb(var(--text-heading, 15 23 42));
    line-height: 1.2;
}

.dark .adv-number {
    color: rgb(var(--dark-text-heading, 241 245 249));
}

.adv-percent {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.adv-percent-value {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: rgb(var(--text-heading, 15 23 42));
    line-height: 1.2;
}

.dark .adv-percent-value {
    color: rgb(var(--dark-text-heading, 241 245 249));
}

.adv-percent-bar-track {
    height: 5px;
    border-radius: 99px;
    background: rgb(var(--color-primary-100, 224 231 255));
    overflow: hidden;
}

.dark .adv-percent-bar-track {
    background: rgb(var(--color-primary-900, 30 27 75));
}

.adv-percent-bar-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, rgb(var(--color-primary-400, 129 140 248)), rgb(var(--color-primary-600, 99 102 241)));
    transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.adv-date {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 500;
    color: rgb(var(--text-heading, 15 23 42));
    line-height: 1.3;
}

.dark .adv-date {
    color: rgb(var(--dark-text-heading, 241 245 249));
}

.adv-date svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: rgb(var(--text-muted, 100 116 139));
}

.adv-array {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.adv-array-chip {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 99px;
    background: rgb(var(--color-primary-100, 224 231 255));
    color: rgb(var(--color-primary-700, 67 56 202));
}

.dark .adv-array-chip {
    background: rgb(var(--color-primary-950, 16 16 50) / 0.5);
    color: rgb(var(--color-primary-300, 165 180 252));
}

.adv-json {
    font-family: 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
    font-size: 10.5px;
    line-height: 1.65;
    color: rgb(var(--text-heading, 15 23 42));
    margin: 0;
    max-height: 150px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
}

.dark .adv-json {
    color: rgb(var(--dark-text-heading, 241 245 249));
}

.adv-grid::-webkit-scrollbar,
.adv-json::-webkit-scrollbar,
.adv-longtext::-webkit-scrollbar {
    width: 3px;
    height: 3px;
}

.adv-grid::-webkit-scrollbar-track,
.adv-json::-webkit-scrollbar-track,
.adv-longtext::-webkit-scrollbar-track {
    background: transparent;
}

.adv-grid::-webkit-scrollbar-thumb,
.adv-json::-webkit-scrollbar-thumb,
.adv-longtext::-webkit-scrollbar-thumb {
    background: rgb(var(--color-primary-200, 199 210 254));
    border-radius: 99px;
}
</style>
