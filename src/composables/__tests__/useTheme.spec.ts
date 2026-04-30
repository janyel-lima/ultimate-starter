// src/composables/__tests__/useTheme.spec.ts
import { useTheme } from '@/composables/useTheme'
import { beforeEach, describe, expect, it } from 'vitest'

// O useDark do VueUse manipula document.documentElement
// Já configuramos o matchMedia mock no setup.ts
describe('useTheme', () => {
  beforeEach(() => {
    // Reseta CSS vars para estado neutro antes de cada teste
    document.documentElement.removeAttribute('style')
    localStorage.clear()
  })

  describe('init()', () => {
    it('aplica a cor primária default ao :root na inicialização', () => {
      const { init } = useTheme()
      init()

      // CSS vars devem estar definidas após init()
      const style = document.documentElement.style
      // --color-primary-500 é a shade "base" gerada pelo useTheme
      const primary500 = style.getPropertyValue('--color-primary-500')
      expect(primary500).toBeTruthy()
      expect(primary500).toMatch(/^\d+ \d+ \d+$/) // formato "R G B"
    })

    it('restaura a cor salva no localStorage', () => {
      // Simula uma sessão anterior onde o usuário escolheu vermelho
      localStorage.setItem('theme:primary-color', '#ef4444')

      const { init, primaryColor } = useTheme()
      init()

      expect(primaryColor.value).toBe('#ef4444')
    })
  })

  describe('setPrimaryColor()', () => {
    it('atualiza as CSS vars quando a cor muda', async () => {
      const { init, setPrimaryColor } = useTheme()
      init()

      // Captura o valor ANTES da mudança
      const before = document.documentElement.style.getPropertyValue('--color-primary-500')

      // Muda para azul
      setPrimaryColor('#3b82f6')

      // Vue é reativo, mas o watcher é síncrono via watch imediato
      await new Promise((r) => setTimeout(r, 0))

      const after = document.documentElement.style.getPropertyValue('--color-primary-500')
      expect(after).not.toBe(before)
    })

    it('persiste a nova cor no localStorage', async () => {
      const { init, setPrimaryColor } = useTheme()
      init()

      setPrimaryColor('#10b981')
      await new Promise((r) => setTimeout(r, 0))

      expect(localStorage.getItem('theme:primary-color')).toBe('#10b981')
    })

    it('gera shades para todas as 11 keys esperadas', () => {
      const { init, setPrimaryColor } = useTheme()
      init()
      setPrimaryColor('#8b5cf6')

      const expectedShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
      const style = document.documentElement.style

      expectedShades.forEach((shade) => {
        const value = style.getPropertyValue(`--color-primary-${shade}`)
        expect(value, `--color-primary-${shade} deve existir`).toBeTruthy()
        expect(value, `--color-primary-${shade} deve ser formato R G B`).toMatch(/^\d+ \d+ \d+$/)
      })
    })
  })

  describe('toggleDark()', () => {
    it('adiciona a classe "dark" ao html element', () => {
      const { toggleDark } = useTheme()

      expect(document.documentElement.classList.contains('dark')).toBe(false)
      toggleDark()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('remove a classe "dark" na segunda chamada', () => {
      const { toggleDark } = useTheme()

      toggleDark() // ativa dark
      toggleDark() // desativa dark

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('persiste a preferência no localStorage via VueUse', () => {
      const { toggleDark } = useTheme()
      toggleDark()

      // VueUse useDark persiste em 'vueuse-color-scheme' por padrão
      // Verificamos que alguma chave de tema foi salva
      const keys = Object.keys(localStorage)
      expect(keys.some((k) => k.includes('color') || k.includes('dark'))).toBe(true)
    })
  })
})
