export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let _prompt: BeforeInstallPromptEvent | null = null
let _onPrompt: ((e: BeforeInstallPromptEvent) => void) | null = null
let _onInstalled: (() => void) | null = null

export function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _prompt = e as BeforeInstallPromptEvent
    console.log('[PWA] beforeinstallprompt capturado ✅')
    _onPrompt?.(_prompt)
  })

  window.addEventListener('appinstalled', () => {
    _prompt = null
    console.log('[PWA] app instalado ✅')
    _onInstalled?.()
  })
}

export function onInstallPrompt(cb: (e: BeforeInstallPromptEvent) => void) {
  _onPrompt = cb
  // Evento já aconteceu antes do Vue montar — dispara imediatamente
  if (_prompt) cb(_prompt)
}

export function onAppInstalled(cb: () => void) {
  _onInstalled = cb
}

export function getInstallPrompt() {
  return _prompt
}
