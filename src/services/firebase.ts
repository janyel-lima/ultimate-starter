// src/services/firebase.ts
// ------------------------------------------------------------
// DECISÃO DE ARQUITETURA — SDK Modular v9+:
//
// Usamos o tree-shakeable SDK modular ao invés do compat.
// Cada função (signInWithEmailAndPassword, etc.) é importada
// individualmente. Isso garante que o Vite/Rollup elimine do
// bundle qualquer parte do SDK não utilizada.
//
// As credenciais vêm de import.meta.env.VITE_* — nunca
// hardcodadas. Em produção, são injetadas pelo GitHub Actions.
// ------------------------------------------------------------

import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth'

if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', {
    // Desabilita o aviso de "não use em produção" no console
    disableWarnings: false,
  })
  console.info('[Firebase] Conectado ao Auth Emulator em localhost:9099')
}

// Configuração lida do ambiente (injetado pelo Vite em build time)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Inicializa o Firebase App uma única vez (singleton)
const app: FirebaseApp = initializeApp(firebaseConfig)

// Instância de Auth exportada para uso nos stores
export const auth: Auth = getAuth(app)

// Provider do Google para login social
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// --- Funções de autenticação tipadas ---

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function loginWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider)
}

export async function registerWithEmail(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function logout(): Promise<void> {
  return signOut(auth)
}

/**
 * Retorna uma Promise que resolve com o usuário atual ou null.
 * Útil para aguardar a inicialização do Auth antes de checar a rota.
 *
 * DECISÃO DE ARQUITETURA:
 * O Firebase Auth é assíncrono na inicialização — onAuthStateChanged
 * não dispara imediatamente. Encapsulamos isso em uma Promise para que
 * o navigation guard do Vue Router possa aguardar o estado ser resolvido
 * antes de decidir redirecionar ou não.
 */
export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject
    )
  })
}

// Re-exporta o tipo User para uso nos stores
export type { User }
