<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleDark } = useTheme()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)
const mode = ref<'login' | 'register'>('login')
const touched = ref({ email: false, password: false, confirm: false })

// ── Validações ────────────────────────────────────────────────────────────────

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailError = computed(() => {
    if (!touched.value.email) return ''
    if (!email.value) return 'E-mail obrigatório'
    if (!emailRegex.test(email.value)) return 'E-mail inválido'
    return ''
})

const passwordRules = computed(() => ({
    length: password.value.length >= 8,
    upper: /[A-Z]/.test(password.value),
    number: /\d/.test(password.value),
    special: /[^A-Za-z0-9]/.test(password.value),
}))

const passwordStrength = computed(() => {
    const score = Object.values(passwordRules.value).filter(Boolean).length
    if (!password.value) return { score: 0, label: '', color: '' }
    if (score <= 1) return { score: 1, label: 'Fraca', color: 'bg-red-500' }
    if (score === 2) return { score: 2, label: 'Razoável', color: 'bg-amber-400' }
    if (score === 3) return { score: 3, label: 'Boa', color: 'bg-yellow-400' }
    return { score: 4, label: 'Forte', color: 'bg-emerald-500' }
})


const passwordError = computed(() => {
    if (!touched.value.password) return ''
    if (!password.value) return 'Senha obrigatória'
    if (mode.value === 'register') {
        if (password.value.length < 8) return 'Mínimo de 8 caracteres'
        if (!/[^A-Za-z0-9]/.test(password.value)) return 'Adicione um caractere especial (!@#$...)'
    }
    return ''
})

const confirmError = computed(() => {
    if (mode.value !== 'register') return ''
    if (!touched.value.confirm) return ''
    if (!confirmPassword.value) return 'Confirme sua senha'
    if (confirmPassword.value !== password.value) return 'As senhas não coincidem'
    return ''
})

const formValid = computed(() => {
    if (emailError.value || passwordError.value) return false
    if (!email.value || !password.value) return false
    if (mode.value === 'register') {
        if (confirmError.value || !confirmPassword.value) return false
        if (!passwordRules.value.length) return false
    }
    return true
})

// Limpa confirmação ao trocar modo
watch(mode, () => {
    confirmPassword.value = ''
    touched.value = { email: false, password: false, confirm: false }
    authStore.clearError()
})

function touchAll() {
    touched.value = { email: true, password: true, confirm: true }
}

// ── Ações ─────────────────────────────────────────────────────────────────────

async function handleEmailSubmit() {
    touchAll()
    if (!formValid.value) return
    isLoading.value = true
    authStore.clearError()
    try {
        if (mode.value === 'login') {
            await authStore.loginEmail(email.value, password.value)
        } else {
            await authStore.register(email.value, password.value)
        }
        await router.push({ name: 'dashboard' })
    } catch { /* tratado no store */ } finally {
        isLoading.value = false
    }
}

async function handleGoogleLogin() {
    isLoading.value = true
    authStore.clearError()
    try {
        await authStore.loginGoogle()
        await router.push({ name: 'dashboard' })
    } catch { /* tratado no store */ } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden
         bg-[rgb(var(--bg-base))] dark:bg-[rgb(var(--dark-bg-base))]">

        <!-- Orbs decorativos de fundo -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
            <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full
                 bg-primary-400/10 dark:bg-primary-600/10 blur-3xl" />
            <div class="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full
                 bg-primary-300/10 dark:bg-primary-700/10 blur-3xl" />
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                 w-[40rem] h-[40rem] rounded-full
                 bg-primary-200/5 dark:bg-primary-900/20 blur-3xl" />
        </div>

        <!-- Tema -->
        <button class="fixed top-4 right-4 z-10 p-2 rounded-xl transition-all duration-200
             text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
             hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
             hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]"
            :aria-label="isDark ? 'Modo claro' : 'Modo escuro'" @click="toggleDark()">
            <svg v-if="isDark" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        </button>

        <!-- Conteúdo -->
        <div class="w-full max-w-[420px] animate-fade-in relative z-10">

            <!-- Brand -->
            <div class="text-center mb-7">
                <div class="relative inline-flex mb-4">
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center
                         bg-gradient-to-br from-primary-400 to-primary-600
                         shadow-lg shadow-primary-500/30">
                        <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <!-- Pulsing ring -->
                    <span class="absolute inset-0 rounded-2xl ring-4 ring-primary-400/20 animate-ping
                         [animation-duration:2.5s]" />
                </div>
                <h1 class="text-2xl font-bold tracking-tight
                     text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                    Ultimate Starter
                </h1>
                <p class="text-sm mt-1 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                    {{ mode === 'login' ? 'Bem-vindo de volta 👋' : 'Crie sua conta gratuitamente' }}
                </p>
            </div>

            <!-- Card -->
            <div class="rounded-2xl p-7
                  bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                  shadow-[0_0_0_1px_rgb(var(--color-primary-100)),0_8px_32px_-4px_rgb(var(--color-primary-300)/20%)]
                  dark:shadow-[0_0_0_1px_rgb(var(--color-primary-900)),0_8px_32px_-4px_rgb(0_0_0/50%)]">

                <!-- Erro global do store -->
                <Transition name="fade">
                    <div v-if="authStore.error" data-testid="auth-error" class="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl text-sm
                         bg-red-50 dark:bg-red-950/60
                         shadow-[0_0_0_1px_rgb(239_68_68/25%)]
                         text-red-600 dark:text-red-400" role="alert">
                        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ authStore.error }}
                    </div>
                </Transition>

                <form class="space-y-4" @submit.prevent="handleEmailSubmit" novalidate>

                    <!-- E-mail -->
                    <div>
                        <label for="email" class="block text-sm font-medium mb-1.5
                             text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            E-mail
                        </label>
                        <div class="relative">
                            <input id="email" v-model="email" type="email" autocomplete="email"
                                placeholder="voce@exemplo.com" :class="[
                                    'w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm transition-all duration-200',
                                    'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]',
                                    'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]',
                                    'placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]',
                                    'focus:outline-none',
                                    emailError
                                        ? 'shadow-[0_0_0_2px_rgb(239_68_68/60%)]'
                                        : 'shadow-[0_0_0_1px_rgb(var(--color-primary-100))] dark:shadow-[0_0_0_1px_rgb(var(--color-primary-900))] focus:shadow-[0_0_0_2px_rgb(var(--color-primary-400))] dark:focus:shadow-[0_0_0_2px_rgb(var(--color-primary-600))]',
                                ]" @blur="touched.email = true" />
                            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                                :class="emailError ? 'text-red-400' : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]'"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        </div>
                        <Transition name="slide-down">
                            <p v-if="emailError"
                                class="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clip-rule="evenodd" />
                                </svg>
                                {{ emailError }}
                            </p>
                        </Transition>
                    </div>

                    <!-- Senha -->
                    <div>
                        <label for="password" class="block text-sm font-medium mb-1.5
                             text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            Senha
                        </label>
                        <div class="relative">
                            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'"
                                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                                placeholder="••••••••" :class="[
                                    'w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all duration-200',
                                    'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]',
                                    'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]',
                                    'placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]',
                                    'focus:outline-none',
                                    passwordError
                                        ? 'shadow-[0_0_0_2px_rgb(239_68_68/60%)]'
                                        : 'shadow-[0_0_0_1px_rgb(var(--color-primary-100))] dark:shadow-[0_0_0_1px_rgb(var(--color-primary-900))] focus:shadow-[0_0_0_2px_rgb(var(--color-primary-400))] dark:focus:shadow-[0_0_0_2px_rgb(var(--color-primary-600))]',
                                ]" @blur="touched.password = true" />
                            <!-- Ícone cadeado -->
                            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                                :class="passwordError ? 'text-red-400' : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]'"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <!-- Toggle visibilidade -->
                            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors
                                 text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                                 hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]"
                                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                                @click="showPassword = !showPassword">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round"
                                        stroke-width="1.75"
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </div>

                        <!-- Força da senha (só no register) -->
                        <Transition name="slide-down">
                            <div v-if="mode === 'register' && password" class="mt-3 space-y-2.5">

                                <!-- Barra segmentada com brilho -->
                                <div class="flex gap-1">
                                    <div v-for="i in 4" :key="i"
                                        class="relative h-1.5 flex-1 rounded-full overflow-hidden transition-all duration-500"
                                        :class="i <= passwordStrength.score
                                            ? 'opacity-100'
                                            : 'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))] opacity-60'">
                                        <!-- Segmento preenchido -->
                                        <div v-if="i <= passwordStrength.score"
                                            class="absolute inset-0 rounded-full transition-all duration-500" :class="{
                                                'bg-red-400': passwordStrength.score === 1,
                                                'bg-amber-400': passwordStrength.score === 2,
                                                'bg-yellow-400': passwordStrength.score === 3,
                                                'bg-emerald-400': passwordStrength.score === 4,
                                            }" />
                                        <!-- Brilho interno -->
                                        <div v-if="i <= passwordStrength.score" class="absolute inset-x-0 top-0 h-1/2 rounded-full opacity-60
                           bg-white/40" />
                                        <!-- Glow externo -->
                                        <div v-if="i <= passwordStrength.score"
                                            class="absolute inset-0 rounded-full blur-[3px] opacity-70 transition-all duration-500"
                                            :class="{
                                                'bg-red-400': passwordStrength.score === 1,
                                                'bg-amber-400': passwordStrength.score === 2,
                                                'bg-yellow-400': passwordStrength.score === 3,
                                                'bg-emerald-400': passwordStrength.score === 4,
                                            }" />
                                    </div>
                                </div>

                                <!-- Label + checklist -->
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2.5">
                                        <span v-for="[key, label] in [
                                            ['length', 'a-z (8+)'],
                                            ['upper', 'A-Z'],
                                            ['number', '0-9'],
                                            ['special', '!@#'],
                                        ]" :key="key"
                                            class="flex items-center gap-1 text-[10px] font-medium transition-all duration-300"
                                            :class="passwordRules[key as keyof typeof passwordRules]
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]'">
                                            <svg class="w-3 h-3 shrink-0 transition-all duration-300" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                                <path v-if="passwordRules[key as keyof typeof passwordRules]"
                                                    stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                                <path v-else stroke-linecap="round" stroke-linejoin="round"
                                                    d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {{ label }}
                                        </span>
                                    </div>

                                    <span
                                        class="text-[10px] font-semibold tracking-wide uppercase transition-all duration-300"
                                        :class="{
                                            'text-red-500 dark:text-red-400': passwordStrength.score === 1,
                                            'text-amber-500 dark:text-amber-400': passwordStrength.score === 2,
                                            'text-yellow-500 dark:text-yellow-400': passwordStrength.score === 3,
                                            'text-emerald-600 dark:text-emerald-400': passwordStrength.score === 4,
                                        }">
                                        {{ passwordStrength.label }}
                                    </span>
                                </div>

                            </div>
                        </Transition>

                        <Transition name="slide-down">
                            <p v-if="passwordError"
                                class="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clip-rule="evenodd" />
                                </svg>
                                {{ passwordError }}
                            </p>
                        </Transition>
                    </div>

                    <!-- Confirmar senha (só no register) -->
                    <Transition name="slide-down">
                        <div v-if="mode === 'register'">
                            <label for="confirm" class="block text-sm font-medium mb-1.5
                                 text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                                Confirmar senha
                            </label>
                            <div class="relative">
                                <input id="confirm" v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'"
                                    autocomplete="new-password" placeholder="••••••••" :class="[
                                        'w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all duration-200',
                                        'bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]',
                                        'text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]',
                                        'placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]',
                                        'focus:outline-none',
                                        confirmError
                                            ? 'shadow-[0_0_0_2px_rgb(239_68_68/60%)]'
                                            : confirmPassword && !confirmError
                                                ? 'shadow-[0_0_0_2px_rgb(16_185_129/50%)]'
                                                : 'shadow-[0_0_0_1px_rgb(var(--color-primary-100))] dark:shadow-[0_0_0_1px_rgb(var(--color-primary-900))] focus:shadow-[0_0_0_2px_rgb(var(--color-primary-400))] dark:focus:shadow-[0_0_0_2px_rgb(var(--color-primary-600))]',
                                    ]" @blur="touched.confirm = true" />
                                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                                    :class="confirmError ? 'text-red-400' : confirmPassword && !confirmError ? 'text-emerald-500' : 'text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]'"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <button type="button"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors
                                     text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                                     hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]"
                                    @click="showConfirm = !showConfirm">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path v-if="showConfirm" stroke-linecap="round" stroke-linejoin="round"
                                            stroke-width="1.75"
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            </div>
                            <Transition name="slide-down">
                                <p v-if="confirmError"
                                    class="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clip-rule="evenodd" />
                                    </svg>
                                    {{ confirmError }}
                                </p>
                            </Transition>
                        </div>
                    </Transition>

                    <!-- Esqueci senha (só login) -->
                    <Transition name="fade">
                        <div v-if="mode === 'login'" class="flex justify-end -mt-1">
                            <button type="button"
                                class="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                                Esqueci minha senha
                            </button>
                        </div>
                    </Transition>

                    <!-- Submit -->
                    <AppButton type="submit" :loading="isLoading" full-width class="mt-1">
                        {{ mode === 'login' ? 'Entrar' : 'Criar conta' }}
                    </AppButton>
                </form>

                <!-- Divider -->
                <div class="relative my-5">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full h-px
                             bg-[rgb(var(--color-primary-100))] dark:bg-[rgb(var(--color-primary-900))]" />
                    </div>
                    <div class="relative flex justify-center text-xs
                         text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                        <span class="px-3
                             bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]">
                            ou continue com
                        </span>
                    </div>
                </div>

                <!-- Google -->
                <AppButton variant="secondary" :loading="isLoading" full-width @click="handleGoogleLogin">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar com Google
                </AppButton>

                <!-- Toggle login/cadastro -->
                <p class="text-center text-sm mt-5
                     text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                    {{ mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?' }}
                    <button data-testid="toggle-auth-mode"
                        class="text-primary-600 dark:text-primary-400 font-semibold hover:underline ml-1"
                        @click="mode = mode === 'login' ? 'register' : 'login'">
                        {{ mode === 'login' ? 'Criar conta' : 'Entrar' }}
                    </button>
                </p>
            </div>

            <!-- Termos (só no register) -->
            <Transition name="fade">
                <p v-if="mode === 'register'" class="text-center text-[11px] mt-4
                         text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                    Ao criar uma conta você concorda com os
                    <a href="#" class="text-primary-600 dark:text-primary-400 hover:underline">Termos de uso</a>
                    e a
                    <a href="#" class="text-primary-600 dark:text-primary-400 hover:underline">Política de
                        privacidade</a>.
                </p>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
