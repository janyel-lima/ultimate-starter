// src/services/firebase.ts
// ------------------------------------------------------------
// DECISÃO DE ARQUITETURA — SDK Modular v9+:
//
// Usamos o tree-shakeable SDK modular ao invés do compat.
// Cada função é importada individualmente — o Vite/Rollup
// elimina do bundle qualquer parte do SDK não utilizada.
//
// ORDEM DE INICIALIZAÇÃO (crítica):
//   1. initializeApp → cria o FirebaseApp
//   2. getAuth(app)  → cria a instância de Auth
//   3. connectAuthEmulator → deve vir DEPOIS de auth existir
//
// O bug original chamava connectAuthEmulator ANTES de auth
// ser declarado e sem importá-lo. Corrigido abaixo.
// ------------------------------------------------------------

import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  connectAuthEmulator,
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

// Configuração lida do ambiente (injetado pelo Vite em build time)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// 1. Inicializa o FirebaseApp (singleton)
const app: FirebaseApp = initializeApp(firebaseConfig)

// 2. Cria a instância de Auth
export const auth: Auth = getAuth(app)

// 3. Conecta ao emulator APENAS depois que auth existe
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  console.info('[Firebase] Conectado ao Auth Emulator → http://localhost:9099')
}

// Google provider com prompt de seleção de conta sempre visível
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
 * Promise que resolve com o usuário atual ou null.
 * Aguarda o Firebase resolver o estado inicial de auth —
 * essencial para o navigation guard não redirecionar
 * antes da sessão ser confirmada.
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

export type { User }
