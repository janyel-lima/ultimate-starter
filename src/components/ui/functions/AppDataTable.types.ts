// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type ColumnType = 'text' | 'number' | 'date' | 'badge' | 'boolean' | 'currency'
export type Density = 'compact' | 'normal' | 'comfortable'

export interface BadgeConfig {
  label: string
  dot?: string
  class: string
}

export interface Column {
  key: string
  label: string
  type?: ColumnType
  sortable?: boolean
  searchable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  format?: (value: any, row: Record<string, any>) => string
  badgeMap?: Record<string, BadgeConfig>
  hidden?: boolean
  prefix?: string
  suffix?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Label humanization
// ─────────────────────────────────────────────────────────────────────────────
const ACRONYMS = new Set([
  'id',
  'url',
  'uri',
  'uuid',
  'api',
  'sdk',
  'cpf',
  'cnpj',
  'rg',
  'brl',
  'usd',
  'eur',
  'cep',
  'uf',
  'ip',
  'pdf',
  'xml',
  'json',
  'html',
  'css',
  'sql',
  'db',
  'os',
  'ui',
  'ux',
  'crm',
  'erp',
  'nf',
  'nfe',
  'pix',
  'iban',
  'swift',
])

export function humanizeKey(key: string): string {
  const raw = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .trim()

  return raw
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase()
      if (ACRONYMS.has(lower)) return lower.toUpperCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}
