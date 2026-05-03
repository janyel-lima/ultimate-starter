<script setup lang="ts">
// AppStatusBadge.vue — Badge de status com ponto colorido animável.
// Agnóstico ao domínio: recebe label, cor do dot e variante de badge.
//
// Uso:
//   <AppStatusBadge label="Em análise" dot="bg-amber-400 animate-pulse" badge="bg-amber-100 text-amber-700 ..." />

defineProps<{
    label: string
    /** Classes Tailwind para o ponto (cor + animação opcional) */
    dot: string
    /** Classes Tailwind para o container do badge (bg + text) */
    badge: string
    /** Tamanho do ponto — padrão 'sm' */
    dotSize?: 'xs' | 'sm'
}>()
</script>

<template>
    <span :class="[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold',
        badge,
        dotSize === 'xs' ? 'text-[9px]' : 'text-[10px]',
    ]">
        <span :class="[
            'rounded-full flex-shrink-0',
            dot,
            dotSize === 'xs' ? 'w-1 h-1' : 'w-1.5 h-1.5',
        ]" />
        {{ label }}
    </span>
</template>
