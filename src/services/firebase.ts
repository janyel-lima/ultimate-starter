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
//   2. getAuth(app) + getFirestore(app) + getStorage(app)
//   3. connectXxxEmulator → deve vir DEPOIS das instâncias existirem
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
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore' // ← add
import { connectStorageEmulator, getStorage } from 'firebase/storage' // ← add

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app: FirebaseApp = initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Conecta TODOS os serviços ao emulator de uma vez
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 5173) // ← Vite proxy
  console.info('[Firebase] ✅ Emulators conectados')
} else {
  console.warn('[Firebase] ⚠️ USANDO PRODUÇÃO — emulator desativado')
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
