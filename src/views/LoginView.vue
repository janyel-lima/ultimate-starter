<script setup lang="ts">
// LoginView.vue
// FIX: o cadastro (register) agora passa pelo authStore.register(),
// que centraliza o tratamento de erro igual ao loginEmail.
// Antes, registerWithEmail era importado diretamente, bypassando
// o parseFirebaseError e o authStore.error nunca era preenchido.

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
            // FIX: usa authStore.register() para que erros cheguem ao authStore.error
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
    <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">

        <!-- Toggle de tema no canto -->
        <button class="fixed top-4 right-4 p-2 rounded-lg text-slate-500 hover:text-slate-800
             dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100
             dark:hover:bg-slate-800 transition-colors"
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
                <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Ultimate Starter</h1>
                <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    {{ mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta' }}
                </p>
            </div>

            <!-- Form card -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100
                  dark:border-slate-800 p-8">

                <!-- Erro do store -->
                <Transition name="fade">
                    <div v-if="authStore.error" data-testid="auth-error" class="mb-5 p-3 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900
                   rounded-xl text-red-600 dark:text-red-400 text-sm" role="alert">
                        {{ authStore.error }}
                    </div>
                </Transition>

                <form class="space-y-4" @submit.prevent="handleEmailSubmit">
                    <!-- E-mail -->
                    <div>
                        <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            E-mail
                        </label>
                        <input id="email" v-model="email" type="email" required autocomplete="email"
                            placeholder="voce@exemplo.com" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                     bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50
                     placeholder:text-slate-400 dark:placeholder:text-slate-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-shadow text-sm" />
                    </div>

                    <!-- Senha -->
                    <div>
                        <label for="password"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Senha
                        </label>
                        <div class="relative">
                            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" required
                                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                                placeholder="••••••••" class="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700
                       bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50
                       placeholder:text-slate-400 dark:placeholder:text-slate-500
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       transition-shadow text-sm" />
                            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                       hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
                        <div class="w-full border-t border-slate-100 dark:border-slate-800" />
                    </div>
                    <div class="relative flex justify-center text-xs text-slate-400 dark:text-slate-500">
                        <span class="bg-white dark:bg-slate-900 px-2">ou continue com</span>
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
                <p class="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
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
