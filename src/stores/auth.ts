// src/stores/auth.ts
import {
  auth,
  logout as firebaseLogout,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  type User,
} from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user = ref<User | null>(null)
  const loading = ref(true) // true até onAuthStateChanged disparar pela primeira vez
  const error = ref<string | null>(null)

  // --- Getters ---
  const isAuthenticated = computed(() => !!user.value)
  const userDisplayName = computed(() => user.value?.displayName ?? user.value?.email ?? 'Usuário')

  // --- Actions ---

  /**
   * Inicializa o listener de auth state.
   * Deve ser chamado UMA VEZ em main.ts, antes de montar o app.
   * Retorna Promise que resolve quando o estado inicial é conhecido.
   */
  function init(): Promise<void> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        user.value = firebaseUser
        loading.value = false
        resolve()
      })
    })
  }

  async function loginEmail(email: string, password: string): Promise<void> {
    error.value = null
    try {
      await loginWithEmail(email, password)
      // user.value é atualizado automaticamente pelo listener do onAuthStateChanged
    } catch (e: unknown) {
      error.value = parseFirebaseError(e)
      throw e
    }
  }

  async function loginGoogle(): Promise<void> {
    error.value = null
    try {
      await loginWithGoogle()
    } catch (e: unknown) {
      error.value = parseFirebaseError(e)
      throw e
    }
  }

  /**
   * Cadastro via email/senha.
   * FIX: antes era chamado diretamente na view, bypassando
   * o tratamento de erro do store. Agora centralizado aqui.
   */
  async function register(email: string, password: string): Promise<void> {
    error.value = null
    try {
      await registerWithEmail(email, password)
    } catch (e: unknown) {
      error.value = parseFirebaseError(e)
      throw e
    }
  }

  async function logout(): Promise<void> {
    await firebaseLogout()
    user.value = null
  }

  function clearError(): void {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    userDisplayName,
    init,
    loginEmail,
    loginGoogle,
    register,
    logout,
    clearError,
  }
})

// Mapeia códigos de erro do Firebase para mensagens em português
function parseFirebaseError(e: unknown): string {
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const code = (e as { code: string }).code
    const messages: Record<string, string> = {
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-credential': 'Credenciais inválidas.',
      'auth/email-already-in-use': 'Este e-mail já está em uso.',
      'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
      'auth/popup-closed-by-user': 'Login cancelado.',
      'auth/weak-password': 'Senha fraca. Use ao menos 6 caracteres.',
      'auth/invalid-email': 'Endereço de e-mail inválido.',
      'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
    }
    return messages[code] ?? 'Ocorreu um erro. Tente novamente.'
  }
  return 'Erro desconhecido.'
}
