// src/test/mocks/firebase.ts
// ------------------------------------------------------------
// DECISÃO DE ARQUITETURA — Mockar a camada de serviço, não o SDK:
//
// Poderíamos mockar 'firebase/auth' diretamente com vi.mock,
// mas isso cria acoplamento entre os testes e os internos do SDK.
// Se o SDK mudar sua API interna, todos os testes quebram.
//
// Melhora: mockamos '@/services/firebase' — nossa própria camada.
// Os testes testam nosso código (store, composables, views),
// não o comportamento do Firebase em si.
// ------------------------------------------------------------

import type { User, UserCredential } from 'firebase/auth'
import { vi } from 'vitest'

// --- Fixtures reutilizáveis ---

export const mockUser: Partial<User> = {
  uid: 'test-uid-abc123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  photoURL: null,
  isAnonymous: false,
}

export const mockAdminUser: Partial<User> = {
  uid: 'admin-uid-xyz789',
  email: 'admin@example.com',
  displayName: 'Admin User',
  emailVerified: true,
  photoURL: 'https://example.com/photo.jpg',
  isAnonymous: false,
}

export function createMockCredential(user = mockUser): Partial<UserCredential> {
  return {
    user: user as User,
    providerId: 'password',
    operationType: 'signIn',
  }
}

// --- Mock do módulo de serviços ---
// vi.mock é hoisted pelo Vitest para o topo do arquivo automaticamente.
// Todos os testes que importam este arquivo terão '@/services/firebase' mockado.

vi.mock('@/services/firebase', () => ({
  auth: { currentUser: null },
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}))

// Também mockamos o onAuthStateChanged do SDK diretamente,
// pois o auth store o importa diretamente para o listener de estado.
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>()
  return {
    ...actual,
    getAuth: vi.fn(() => ({ currentUser: null })),
    onAuthStateChanged: vi.fn(),
    connectAuthEmulator: vi.fn(),
  }
})

// Acessores tipados para uso nos testes
export const firebaseMocks = {
  get loginWithEmail() {
    return vi.mocked(require('@/services/firebase').loginWithEmail)
  },
  get loginWithGoogle() {
    return vi.mocked(require('@/services/firebase').loginWithGoogle)
  },
  get registerWithEmail() {
    return vi.mocked(require('@/services/firebase').registerWithEmail)
  },
  get logout() {
    return vi.mocked(require('@/services/firebase').logout)
  },
  get getCurrentUser() {
    return vi.mocked(require('@/services/firebase').getCurrentUser)
  },
}
