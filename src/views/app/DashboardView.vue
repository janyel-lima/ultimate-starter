<script setup lang="ts">
import DataTable from '@/components/ui/AppDataTable.vue'
import type { Column } from '@/components/ui/functions/AppDataTable.types'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { setPrimaryColor } = useTheme()

const presetColors = [
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Teal', value: '#14b8a6' },
    { label: 'Sky', value: '#0ea5e9' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Colunas — só as que precisam de config especial.
// Texto, número, data e boolean são inferidos automaticamente dos dados.
// ─────────────────────────────────────────────────────────────────────────────
const columns: Column[] = [
    // ① Precisa de slot customizado + width fixa → explícito
    {
        key: 'name',
        label: 'Colaborador',
        sortable: true,
        searchable: true,
        width: '220px',
    },

    // ② Badge — badgeMap não pode ser inferido
    {
        key: 'department',
        label: 'Departamento',
        type: 'badge',
        sortable: true,
        searchable: true,
        badgeMap: {
            Engenharia: { label: 'Engenharia', dot: 'bg-blue-400', class: 'bg-blue-100    dark:bg-blue-950/60    text-blue-700    dark:text-blue-300' },
            Produto: { label: 'Produto', dot: 'bg-violet-400', class: 'bg-violet-100  dark:bg-violet-950/60  text-violet-700  dark:text-violet-300' },
            Design: { label: 'Design', dot: 'bg-pink-400', class: 'bg-pink-100    dark:bg-pink-950/60    text-pink-700    dark:text-pink-300' },
            Comercial: { label: 'Comercial', dot: 'bg-amber-400', class: 'bg-amber-100   dark:bg-amber-950/60   text-amber-700   dark:text-amber-300' },
            Financeiro: { label: 'Financeiro', dot: 'bg-emerald-400', class: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
            RH: { label: 'RH', dot: 'bg-orange-400', class: 'bg-orange-100  dark:bg-orange-950/60  text-orange-700  dark:text-orange-300' },
        },
    },

    // ③ Badge
    {
        key: 'status',
        label: 'Status',
        type: 'badge',
        sortable: true,
        badgeMap: {
            Ativo: { label: 'Ativo', dot: 'bg-emerald-400', class: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
            Férias: { label: 'Férias', dot: 'bg-sky-400', class: 'bg-sky-100     dark:bg-sky-950/60     text-sky-700     dark:text-sky-300' },
            Afastado: { label: 'Afastado', dot: 'bg-rose-400', class: 'bg-rose-100    dark:bg-rose-950/60    text-rose-700    dark:text-rose-300' },
            Remoto: { label: 'Remoto', dot: 'bg-violet-400', class: 'bg-violet-100  dark:bg-violet-950/60  text-violet-700  dark:text-violet-300' },
        },
    },

    // ④ Currency — prefixo "R$ " e casas decimais
    {
        key: 'salary',
        label: 'Salário',
        type: 'currency',
        sortable: true,
        searchable: false,
        align: 'right',
    },

    // ⑤ Número com formato customizado (barra de progresso via slot) + align
    {
        key: 'performance',
        label: 'Performance',
        type: 'number',
        sortable: true,
        searchable: false,
        align: 'right',
        format: (val) => val != null ? `${val}%` : '—',
    },

    // ⑥ Date — inferência detecta ISO string, mas precisamos de searchable: false
    {
        key: 'hiredAt',
        label: 'Admissão',
        type: 'date',
        sortable: true,
        searchable: false,
    },

    // ⑦ Boolean — inferido corretamente, mas align: center precisa ser explícito
    {
        key: 'remote',
        label: 'Remoto',
        type: 'boolean',
        sortable: true,
        searchable: false,
        align: 'center',
    },

    // ⑧ Número simples com align
    {
        key: 'projects',
        label: 'Projetos',
        type: 'number',
        sortable: true,
        searchable: false,
        align: 'center',
    },

    // ⑨ Começa oculto — hidden não pode ser inferido
    {
        key: 'email',
        label: 'E-mail',
        sortable: false,
        searchable: true,
        hidden: true,
    },
]

// labelMap: sobrescreve labels sem precisar tocar no array de colunas.
// Útil quando o dado vem de uma API com keys em inglês/snake_case.
const labelMap: Record<string, string> = {
    hiredAt: 'Admissão',
    remote: 'Remoto',
}

const rows = [
    { id: '1', name: 'Ana Luiza Mendes', department: 'Engenharia', status: 'Ativo', salary: 12400, performance: 94, hiredAt: '2020-03-15', remote: true, projects: 7, email: 'ana.mendes@company.io' },
    { id: '2', name: 'Bruno Carvalho', department: 'Produto', status: 'Remoto', salary: 11200, performance: 88, hiredAt: '2021-07-01', remote: true, projects: 4, email: 'bruno.carvalho@company.io' },
    { id: '3', name: 'Carla Nogueira', department: 'Design', status: 'Ativo', salary: 9800, performance: 91, hiredAt: '2019-11-20', remote: false, projects: 6, email: 'carla.n@company.io' },
    { id: '4', name: 'Diego Ferreira', department: 'Comercial', status: 'Férias', salary: 8500, performance: 76, hiredAt: '2022-01-10', remote: false, projects: 2, email: 'diego.f@company.io' },
    { id: '5', name: 'Eduarda Santos', department: 'Financeiro', status: 'Ativo', salary: 10100, performance: 83, hiredAt: '2020-09-05', remote: true, projects: 3, email: 'eduarda.s@company.io' },
    { id: '6', name: 'Felipe Rocha', department: 'Engenharia', status: 'Ativo', salary: 14300, performance: 97, hiredAt: '2018-06-12', remote: true, projects: 11, email: 'felipe.r@company.io' },
    { id: '7', name: 'Gabriela Lima', department: 'RH', status: 'Afastado', salary: 7600, performance: 68, hiredAt: '2023-03-01', remote: false, projects: 1, email: 'gabi.lima@company.io' },
    { id: '8', name: 'Henrique Alves', department: 'Engenharia', status: 'Remoto', salary: 13100, performance: 90, hiredAt: '2021-02-18', remote: true, projects: 8, email: 'henrique.a@company.io' },
    { id: '9', name: 'Isabela Teixeira', department: 'Produto', status: 'Ativo', salary: 10800, performance: 85, hiredAt: '2020-12-03', remote: false, projects: 5, email: 'isa.t@company.io' },
    { id: '10', name: 'João Pedro Mota', department: 'Design', status: 'Ativo', salary: 9300, performance: 79, hiredAt: '2022-08-22', remote: true, projects: 4, email: 'joao.mota@company.io' },
    { id: '11', name: 'Karen Oliveira', department: 'Financeiro', status: 'Remoto', salary: 11500, performance: 92, hiredAt: '2019-05-30', remote: true, projects: 6, email: 'karen.o@company.io' },
    { id: '12', name: 'Lucas Martins', department: 'Comercial', status: 'Ativo', salary: 8900, performance: 81, hiredAt: '2021-10-14', remote: false, projects: 3, email: 'lucas.m@company.io' },
    { id: '13', name: 'Mariana Corrêa', department: 'Engenharia', status: 'Ativo', salary: 15200, performance: 99, hiredAt: '2017-04-08', remote: true, projects: 14, email: 'mari.c@company.io' },
    { id: '14', name: 'Nicolas Barbosa', department: 'RH', status: 'Férias', salary: 7200, performance: 72, hiredAt: '2023-07-19', remote: false, projects: 1, email: 'nicolas.b@company.io' },
    { id: '15', name: 'Olivia Pires', department: 'Produto', status: 'Ativo', salary: 12700, performance: 93, hiredAt: '2020-01-27', remote: true, projects: 9, email: 'olivia.p@company.io' },
    { id: '16', name: 'Paulo Henrique Souza', department: 'Engenharia', status: 'Remoto', salary: 13800, performance: 87, hiredAt: '2019-08-11', remote: true, projects: 10, email: 'ph.souza@company.io' },
    { id: '17', name: 'Rafaela Costa', department: 'Design', status: 'Afastado', salary: 9100, performance: 65, hiredAt: '2022-05-03', remote: false, projects: 2, email: 'rafa.c@company.io' },
    { id: '18', name: 'Samuel Vasconcelos', department: 'Comercial', status: 'Ativo', salary: 8200, performance: 78, hiredAt: '2021-11-29', remote: false, projects: 3, email: 'samuel.v@company.io' },
    { id: '19', name: 'Tatiane Ribeiro', department: 'Financeiro', status: 'Ativo', salary: 10400, performance: 86, hiredAt: '2020-07-16', remote: true, projects: 5, email: 'tati.r@company.io' },
    { id: '20', name: 'Victor Hugo Nunes', department: 'Engenharia', status: 'Ativo', salary: 16000, performance: 98, hiredAt: '2016-09-25', remote: true, projects: 17, email: 'victor.n@company.io' },
]

// Top performers ganham borda verde
function rowHighlight(row: Record<string, any>): string {
    return row.performance >= 95
        ? 'ring-1 ring-inset ring-emerald-200 dark:ring-emerald-900/60'
        : ''
}

function handleSelection(selected: Record<string, any>[]) {
    console.log('Selecionados:', selected.map(r => r.name))
}
</script>

<template>
    <div class="max-w-6xl mx-auto space-y-4 sm:space-y-6">

        <!-- Welcome card -->
        <div
            class="relative overflow-hidden rounded-xl sm:rounded-2xl p-5 sm:p-8
                   bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                   [box-shadow:0_0_0_1px_rgb(var(--color-primary-100)),0_4px_24px_-4px_rgb(var(--color-primary-200)/40%)]
                   dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900)),0_4px_24px_-4px_rgb(var(--color-primary-950)/60%)]">

            <div class="absolute -top-10 -right-10 sm:-top-12 sm:-right-12 w-36 sm:w-48 h-36 sm:h-48 rounded-full opacity-10
                        bg-primary-400 dark:bg-primary-600 blur-3xl pointer-events-none" />

            <div class="relative text-center">
                <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl mx-auto mb-4 sm:mb-5 flex items-center justify-center
                             bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/25">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>

                <h2 class="text-lg sm:text-xl font-semibold mb-2
                             text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                    Olá, {{ authStore.userDisplayName }}! 👋
                </h2>
                <p class="text-xs sm:text-sm max-w-md mx-auto leading-relaxed
                             text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                    Seu dashboard está pronto. Use o seletor de cores no header para ver o
                    sistema de temas dinâmico em ação. Toda a paleta é gerada a partir de uma única cor.
                </p>

                <div class="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2">
                    <span v-for="color in [
                        { label: 'Primary', cls: 'bg-primary-500' },
                        { label: 'Secondary', cls: 'bg-secondary-500' },
                        { label: 'Tertiary', cls: 'bg-tertiary-500' },
                    ]" :key="color.label"
                        class="inline-flex items-center px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium text-white shadow-sm"
                        :class="color.cls">
                        {{ color.label }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Color presets -->
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            <button v-for="color in presetColors" :key="color.value" class="group flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl transition-all
                         bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                         [box-shadow:0_0_0_1px_rgb(var(--color-primary-100))] dark:[box-shadow:0_0_0_1px_rgb(var(--color-primary-900))]
                         hover:[box-shadow:0_0_0_2px_rgb(var(--color-primary-300))] dark:hover:[box-shadow:0_0_0_2px_rgb(var(--color-primary-700))]
                         hover:-translate-y-0.5 active:scale-95" @click="setPrimaryColor(color.value)">
                <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-sm transition-transform group-hover:scale-110"
                    :style="{ background: color.value }" />
                <span class="text-[10px] font-medium
                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                    {{ color.label }}
                </span>
            </button>
        </div>

        <!-- ── DataTable ───────────────────────────────────────── -->
        <DataTable :columns="columns" :label-map="labelMap" :rows="rows" :page-size="8"
            :page-size-options="[8, 16, rows.length]" title="Colaboradores" subtitle="RH · 2024"
            export-filename="colaboradores" :enable-selection="true" :enable-export="true" :enable-column-toggle="true"
            :enable-density="true" :enable-search="true" :enable-sort="true" :enable-multi-sort="true"
            :row-class="rowHighlight" @selection-change="handleSelection">
            <!-- Ações em lote -->
            <template #batch-actions="{ selected, clear }">
                <button class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all
                           bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400
                           hover:bg-rose-200 dark:hover:bg-rose-900/60"
                    @click="() => { alert(`Remover ${selected.length} colaborador(es)?`); clear() }">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remover selecionados
                </button>
            </template>

            <!-- Botão extra na toolbar -->
            <template #toolbar-actions>
                <button class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all
                           bg-primary-500 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/20">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Novo
                </button>
            </template>

            <!-- Célula customizada: barra de performance -->
            <template #cell-performance="{ value }">
                <div class="flex items-center gap-2 min-w-[80px]">
                    <div class="flex-1 h-1.5 rounded-full overflow-hidden
                                bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]">
                        <div class="h-full rounded-full transition-all"
                            :class="value >= 90 ? 'bg-emerald-500' : value >= 75 ? 'bg-amber-500' : 'bg-rose-500'"
                            :style="{ width: `${value}%` }" />
                    </div>
                    <span class="text-[11px] font-mono tabular-nums shrink-0
                                 text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                        {{ value }}%
                    </span>
                </div>
            </template>

            <!-- Célula customizada: avatar + nome + email -->
            <template #cell-name="{ value, row }">
                <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold
                                bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                        {{value.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}}
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs font-medium truncate
                                  text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            {{ value }}
                        </p>
                        <p class="text-[10px] truncate
                                  text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                            {{ row.email }}
                        </p>
                    </div>
                </div>
            </template>

            <!-- Ações por linha -->
            <template #row-actions="{ row }">
                <div class="flex items-center justify-end gap-1">
                    <button
                        class="w-6 h-6 rounded-lg flex items-center justify-center transition-all
                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                               hover:bg-primary-100 dark:hover:bg-primary-950/60 hover:text-primary-600 dark:hover:text-primary-400"
                        :title="`Editar ${row.name}`" @click.stop="alert(`Editar: ${row.name}`)">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            stroke-width="1.75">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="w-6 h-6 rounded-lg flex items-center justify-center transition-all
                               text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                               hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-500"
                        :title="`Remover ${row.name}`" @click.stop="alert(`Remover: ${row.name}?`)">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            stroke-width="1.75">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </template>



        </DataTable>

        <p class="text-center text-[11px] leading-relaxed
                  text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
            Busca global · ordenação multi-coluna · seleção com ações em lote ·
            densidade ajustável · toggle de colunas · export JSON/Excel · drawer customizado ·
            <span class="text-emerald-600 dark:text-emerald-400 font-medium">verde</span> = performance ≥ 95%
        </p>

    </div>
</template>
