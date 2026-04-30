// src/stores/__tests__/auth.spec.ts
// FIX: importava '../mocks/firebase' (src/stores/mocks/ — não existe).
// Corrigido para '@/test/mocks/firebase' (caminho real do mock).

import { useAuthStore } from '@/stores/auth'
import '@/test/mocks/firebase' // ativa os vi.mock() necessários
import { createMockCredential, mockUser } from '@/test/mocks/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged)

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // --- Estado inicial ---
  describe('estado inicial', () => {
    it('começa com user null e loading true', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
      expect(store.loading).toBe(true)
      expect(store.error).toBeNull()
    })

    it('isAuthenticated começa como false', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  // --- init() ---
  describe('init()', () => {
    it('resolve a Promise quando onAuthStateChanged dispara com null', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(null)
        return vi.fn()
      })

      const store = useAuthStore()
      await store.init()

      expect(store.user).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('define o user quando onAuthStateChanged dispara com usuário', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(mockUser as never)
        return vi.fn()
      })

      const store = useAuthStore()
      await store.init()

      expect(store.user).toEqual(mockUser)
      expect(store.loading).toBe(false)
      expect(store.isAuthenticated).toBe(true)
    })
  })

  // --- loginEmail() ---
  describe('loginEmail()', () => {
    it('chama loginWithEmail com as credenciais corretas', async () => {
      const { loginWithEmail } = await import('@/services/firebase')
      vi.mocked(loginWithEmail).mockResolvedValueOnce(createMockCredential() as never)

      const store = useAuthStore()
      await store.loginEmail('test@example.com', 'password123')

      expect(loginWithEmail).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(store.error).toBeNull()
    })

    it('define store.error quando o login falha com senha errada', async () => {
      const { loginWithEmail } = await import('@/services/firebase')
      vi.mocked(loginWithEmail).mockRejectedValueOnce({ code: 'auth/wrong-password' })

      const store = useAuthStore()
      await expect(store.loginEmail('test@example.com', 'wrong')).rejects.toBeDefined()
      expect(store.error).toBe('Senha incorreta.')
    })

    it('mapeia código desconhecido para mensagem genérica', async () => {
      const { loginWithEmail } = await import('@/services/firebase')
      vi.mocked(loginWithEmail).mockRejectedValueOnce({ code: 'auth/unknown-error-code' })

      const store = useAuthStore()
      await expect(store.loginEmail('a@b.com', 'pass')).rejects.toBeDefined()
      expect(store.error).toBe('Ocorreu um erro. Tente novamente.')
    })
  })

  // --- loginGoogle() ---
  describe('loginGoogle()', () => {
    it('chama loginWithGoogle e limpa o error', async () => {
      const { loginWithGoogle } = await import('@/services/firebase')
      vi.mocked(loginWithGoogle).mockResolvedValueOnce(createMockCredential() as never)

      const store = useAuthStore()
      store.$patch({ error: 'erro anterior' })

      await store.loginGoogle()

      expect(loginWithGoogle).toHaveBeenCalledOnce()
      expect(store.error).toBeNull()
    })

    it('define error quando o popup é fechado pelo usuário', async () => {
      const { loginWithGoogle } = await import('@/services/firebase')
      vi.mocked(loginWithGoogle).mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' })

      const store = useAuthStore()
      await expect(store.loginGoogle()).rejects.toBeDefined()
      expect(store.error).toBe('Login cancelado.')
    })
  })

  // --- register() ---
  describe('register()', () => {
    it('chama registerWithEmail e limpa o error', async () => {
      const { registerWithEmail } = await import('@/services/firebase')
      vi.mocked(registerWithEmail).mockResolvedValueOnce(createMockCredential() as never)

      const store = useAuthStore()
      await store.register('new@test.com', 'StrongPass1!')

      expect(registerWithEmail).toHaveBeenCalledWith('new@test.com', 'StrongPass1!')
      expect(store.error).toBeNull()
    })

    it('define error quando o email já está em uso', async () => {
      const { registerWithEmail } = await import('@/services/firebase')
      vi.mocked(registerWithEmail).mockRejectedValueOnce({ code: 'auth/email-already-in-use' })

      const store = useAuthStore()
      await expect(store.register('existing@test.com', 'pass')).rejects.toBeDefined()
      expect(store.error).toBe('Este e-mail já está em uso.')
    })

    it('define error para senha fraca', async () => {
      const { registerWithEmail } = await import('@/services/firebase')
      vi.mocked(registerWithEmail).mockRejectedValueOnce({ code: 'auth/weak-password' })

      const store = useAuthStore()
      await expect(store.register('a@b.com', '123')).rejects.toBeDefined()
      expect(store.error).toBe('Senha fraca. Use ao menos 6 caracteres.')
    })
  })

  // --- logout() ---
  describe('logout()', () => {
    it('limpa o user e chama firebase logout', async () => {
      const { logout } = await import('@/services/firebase')
      vi.mocked(logout).mockResolvedValueOnce(undefined)

      const store = useAuthStore()
      store.$patch({ user: mockUser as never })

      await store.logout()

      expect(logout).toHaveBeenCalledOnce()
      expect(store.user).toBeNull()
    })
  })

  // --- clearError() ---
  describe('clearError()', () => {
    it('reseta o campo error para null', () => {
      const store = useAuthStore()
      store.$patch({ error: 'algum erro' })
      store.clearError()
      expect(store.error).toBeNull()
    })
  })

  // --- userDisplayName ---
  describe('userDisplayName', () => {
    it('retorna displayName quando disponível', () => {
      const store = useAuthStore()
      store.$patch({ user: { displayName: 'João Silva', email: 'j@s.com' } as never })
      expect(store.userDisplayName).toBe('João Silva')
    })

    it('fallback para email quando displayName é null', () => {
      const store = useAuthStore()
      store.$patch({ user: { displayName: null, email: 'user@test.com' } as never })
      expect(store.userDisplayName).toBe('user@test.com')
    })

    it('fallback para "Usuário" quando tudo é null', () => {
      const store = useAuthStore()
      store.$patch({ user: { displayName: null, email: null } as never })
      expect(store.userDisplayName).toBe('Usuário')
    })
  })
})
