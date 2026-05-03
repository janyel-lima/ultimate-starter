<script setup lang="ts">
defineProps<{
    appName?: string
    version?: string
    status?: 'operational' | 'degraded' | 'outage'
}>()

const socials = [
    {
        label: 'GitHub',
        href: 'https://github.com',
        icon: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
    },
    {
        label: 'Twitter / X',
        href: 'https://x.com',
        icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    },
    {
        label: 'LinkedIn',
        href: 'https://linkedin.com',
        icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z',
    },
]

const statusConfig = {
    operational: { label: 'Operacional', color: 'bg-emerald-400' },
    degraded: { label: 'Degradado', color: 'bg-amber-400' },
    outage: { label: 'Fora do ar', color: 'bg-red-400' },
}

const year = new Date().getFullYear()
</script>

<template>
    <footer class="relative z-30 flex items-center justify-between h-11 px-4
         bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
         [box-shadow:0_-4px_20px_-4px_rgb(var(--color-primary-300)/30%)]
         dark:[box-shadow:0_-4px_20px_-4px_rgb(var(--color-primary-950)/70%)]">

        <!-- Left: copyright + version -->
        <div class="flex items-center gap-3">
            <span class="text-[11px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                © {{ year }} {{ appName ?? 'Ultimate Starter' }}
            </span>
            <span v-if="version" class="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium
                       text-primary-600 dark:text-primary-400
                       bg-primary-50 dark:bg-primary-950/50">
                {{ version }}
            </span>
        </div>

        <!-- Center: status indicator -->
        <div v-if="status" class="hidden md:flex items-center gap-1.5">
            <span :class="['w-1.5 h-1.5 rounded-full', statusConfig[status].color]" />
            <span class="text-[11px] text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                {{ statusConfig[status].label }}
            </span>
        </div>

        <!-- Right: social links -->
        <div class="flex items-center gap-0.5">
            <a v-for="s in socials" :key="s.label" :href="s.href" :aria-label="s.label" target="_blank"
                rel="noopener noreferrer" class="p-1.5 rounded-lg transition-colors
                     text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                     hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
                     hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path :d="s.icon" />
                </svg>
            </a>
        </div>
    </footer>
</template>
