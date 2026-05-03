<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleDark } = useTheme()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const mode = ref<'login' | 'register'>('login')

async function handleEmailSubmit() {
    if (!email.value || !password.value) return
    isLoading.value = true
    authStore.clearError()

    try {
        if (mode.value === 'login') {
            await authStore.loginEmail(email.value, password.value)
        } else {
            await authStore.register(email.value, password.value)
        }
        await router.push({ name: 'dashboard' })
    } catch {
        // Erro já tratado e disponível em authStore.error
    } finally {
        isLoading.value = false
    }
}

async function handleGoogleLogin() {
    isLoading.value = true
    authStore.clearError()
    try {
        await authStore.loginGoogle()
        await router.push({ name: 'dashboard' })
    } catch {
        // Erro no store
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center p-4
         bg-[rgb(var(--bg-base))] dark:bg-[rgb(var(--dark-bg-base))]">

        <!-- Toggle de tema no canto -->
        <button class="fixed top-4 right-4 p-2 rounded-lg transition-colors
             text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
             hover:bg-[rgb(var(--bg-muted))] dark:hover:bg-[rgb(var(--dark-bg-muted))]
             hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]"
            :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggleDark()">
            <svg v-if="isDark" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        </button>

        <!-- Card principal -->
        <div class="w-full max-w-md animate-fade-in">
            <!-- Brand -->
            <div class="text-center mb-8">
                <div
                    class="inline-flex items-center justify-center w-14 h-14 bg-primary-500 rounded-2xl mb-4 shadow-lg">
                    <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h1
                    class="text-2xl font-bold text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                    Ultimate Starter
                </h1>
                <p class="text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))] text-sm mt-1">
                    {{ mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta' }}
                </p>
            </div>

            <!-- Form card -->
            <div class="rounded-2xl p-8
                  bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]
                  shadow-[0_0_0_1px_rgb(var(--color-primary-100)),0_4px_24px_-4px_rgb(var(--color-primary-200)/30%)]
                  dark:shadow-[0_0_0_1px_rgb(var(--color-primary-900)),0_4px_24px_-4px_rgb(0_0_0/40%)]">

                <!-- Erro do store -->
                <Transition name="fade">
                    <div v-if="authStore.error" data-testid="auth-error" class="mb-5 p-3 rounded-xl text-sm
                   bg-red-50 dark:bg-red-950
                   shadow-[0_0_0_1px_rgb(239_68_68/20%)]
                   text-red-600 dark:text-red-400" role="alert">
                        {{ authStore.error }}
                    </div>
                </Transition>

                <form class="space-y-4" @submit.prevent="handleEmailSubmit">
                    <!-- E-mail -->
                    <div>
                        <label for="email" class="block text-sm font-medium mb-1.5
                             text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            E-mail
                        </label>
                        <input id="email" v-model="email" type="email" required autocomplete="email"
                            placeholder="voce@exemplo.com" class="w-full px-3.5 py-2.5 rounded-xl text-sm
                     bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                     text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                     placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]
                     shadow-[0_0_0_1px_rgb(var(--color-primary-100))] dark:shadow-[0_0_0_1px_rgb(var(--color-primary-900))]
                     focus:outline-none focus:shadow-[0_0_0_2px_rgb(var(--color-primary-400))]
                     dark:focus:shadow-[0_0_0_2px_rgb(var(--color-primary-600))]
                     transition-shadow" />
                    </div>

                    <!-- Senha -->
                    <div>
                        <label for="password" class="block text-sm font-medium mb-1.5
                             text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]">
                            Senha
                        </label>
                        <div class="relative">
                            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" required
                                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                                placeholder="••••••••" class="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm
                       bg-[rgb(var(--bg-muted))] dark:bg-[rgb(var(--dark-bg-muted))]
                       text-[rgb(var(--text-heading))] dark:text-[rgb(var(--dark-text-heading))]
                       placeholder:text-[rgb(var(--text-muted))] dark:placeholder:text-[rgb(var(--dark-text-muted))]
                       shadow-[0_0_0_1px_rgb(var(--color-primary-100))] dark:shadow-[0_0_0_1px_rgb(var(--color-primary-900))]
                       focus:outline-none focus:shadow-[0_0_0_2px_rgb(var(--color-primary-400))]
                       dark:focus:shadow-[0_0_0_2px_rgb(var(--color-primary-600))]
                       transition-shadow" />
                            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors
                       text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]
                       hover:text-[rgb(var(--text-heading))] dark:hover:text-[rgb(var(--dark-text-heading))]"
                                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                                @click="showPassword = !showPassword">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Submit -->
                    <AppButton type="submit" :loading="isLoading" full-width>
                        {{ mode === 'login' ? 'Entrar' : 'Criar conta' }}
                    </AppButton>
                </form>

                <!-- Divider -->
                <div class="relative my-6">
                    <div class="absolute inset-0 flex items-center">
                        <div
                            class="w-full h-px bg-[rgb(var(--color-primary-100))] dark:bg-[rgb(var(--color-primary-900))]" />
                    </div>
                    <div class="relative flex justify-center text-xs
                         text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                        <span class="px-2 bg-[rgb(var(--bg-surface))] dark:bg-[rgb(var(--dark-bg-surface))]">
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
                    Google
                </AppButton>

                <!-- Toggle login/cadastro -->
                <p class="text-center text-sm mt-6
                     text-[rgb(var(--text-muted))] dark:text-[rgb(var(--dark-text-muted))]">
                    {{ mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?' }}
                    <button data-testid="toggle-auth-mode"
                        class="text-primary-600 dark:text-primary-400 font-medium hover:underline ml-1"
                        @click="mode = mode === 'login' ? 'register' : 'login'; authStore.clearError()">
                        {{ mode === 'login' ? 'Criar conta' : 'Entrar' }}
                    </button>
                </p>
            </div>
        </div>
    </div>
</template>
