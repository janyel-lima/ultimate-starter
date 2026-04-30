import App from '@/App.vue'
import '@/assets/main.css'
import { clickOutside } from '@/directives/clickOutside'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const initApp = async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  // Registra a diretiva global
  app.directive('click-outside', clickOutside)

  const authStore = useAuthStore()

  try {
    // Tenta inicializar o Firebase Auth com um timeout de segurança de 3 segundos
    // para evitar que o app fique em branco caso o emulador esteja offline
    await Promise.race([
      authStore.init(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Firebase')), 3000)),
    ])
  } catch (error) {
    console.warn('[Main] O Auth não pôde ser inicializado a tempo ou falhou:', error)
    // O app continua a montagem mesmo assim para mostrar a UI
  } finally {
    app.mount('#app')
    console.log('[Main] App montado com sucesso.')
  }
}

initApp()
