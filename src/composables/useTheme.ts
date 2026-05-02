// src/composables/useTheme.ts
// Sistema de temas totalmente derivado da cor primária:
//  - Primária: cor escolhida pelo usuário
//  - Secundária: +30° no hue (análoga)
//  - Terciária: +60° no hue (análoga mais distante)
//  - Backgrounds, surfaces e textos gerados por lightness
//  - Light mode: fundos claríssimos (shade 50), textos escuros (shade 900)
//  - Dark mode: fundos escuríssimos (shade 950), textos claros (shade 50)

import { useDark, useStorage, useToggle } from '@vueuse/core'
import { watch } from 'vue'

// Lightness por shade
const SHADE_LIGHTNESS: Record<number, number> = {
  50: 97,
  100: 93,
  200: 86,
  300: 74,
  400: 60,
  500: 50,
  600: 41,
  700: 33,
  800: 25,
  900: 18,
  950: 11,
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const full = hex.replace(
    /^#([a-f\d])([a-f\d])([a-f\d])$/i,
    (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
  )
  const r = parseInt(full.slice(1, 3), 16) / 255
  const g = parseInt(full.slice(3, 5), 16) / 255
  const b = parseInt(full.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min
  let h = 0,
    s = 0
  const l = (max + min) / 2
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / delta + 2) / 6
        break
      case b:
        h = ((r - g) / delta + 4) / 6
        break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgbString(h: number, s: number, l: number): string {
  const sn = s / 100,
    ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let r = 0,
    g = 0,
    b = 0
  if (h < 60) {
    r = c
    g = x
    b = 0
  } else if (h < 120) {
    r = x
    g = c
    b = 0
  } else if (h < 180) {
    r = 0
    g = c
    b = x
  } else if (h < 240) {
    r = 0
    g = x
    b = c
  } else if (h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)].join(' ')
}

function applyPalette(prefix: string, h: number, s: number): void {
  const root = document.documentElement
  const sat = Math.min(s, 88)
  for (const [shade, lightness] of Object.entries(SHADE_LIGHTNESS)) {
    root.style.setProperty(`--color-${prefix}-${shade}`, hslToRgbString(h, sat, lightness))
  }
}

function applyTheme(hex: string): void {
  const { h, s } = hexToHsl(hex)
  const root = document.documentElement

  // Paleta primária
  applyPalette('primary', h, s)

  // Secundária: +28° (análoga quente/fria)
  const hSec = (h + 28) % 360
  applyPalette('secondary', hSec, Math.max(s - 10, 30))

  // Terciária: +58° (mais distante, para acentos)
  const hTer = (h + 58) % 360
  applyPalette('tertiary', hTer, Math.max(s - 20, 25))

  // ── Light mode backgrounds (tons clarissimos da primária) ──
  root.style.setProperty('--bg-base', hslToRgbString(h, Math.min(s, 20), 98)) // quase branco tintado
  root.style.setProperty('--bg-surface', hslToRgbString(h, Math.min(s, 14), 100)) // branco com micro-tint
  root.style.setProperty('--bg-muted', hslToRgbString(h, Math.min(s, 30), 95)) // cinza tintado
  root.style.setProperty('--bg-border', hslToRgbString(h, Math.min(s, 25), 88)) // borda suave

  // ── Dark mode backgrounds (tons escuríssimos da primária) ──
  root.style.setProperty('--dark-bg-base', hslToRgbString(h, Math.min(s, 28), 8)) // quase preto tintado
  root.style.setProperty('--dark-bg-surface', hslToRgbString(h, Math.min(s, 22), 12)) // card escuro
  root.style.setProperty('--dark-bg-muted', hslToRgbString(h, Math.min(s, 20), 16)) // secundário escuro
  root.style.setProperty('--dark-bg-border', hslToRgbString(h, Math.min(s, 20), 20)) // borda escura

  // ── Texto adaptativo ──
  root.style.setProperty('--text-heading', hslToRgbString(h, Math.min(s, 18), 12))
  root.style.setProperty('--text-body', hslToRgbString(h, Math.min(s, 12), 30))
  root.style.setProperty('--text-muted', hslToRgbString(h, Math.min(s, 14), 52))
  root.style.setProperty('--dark-text-heading', hslToRgbString(h, Math.min(s, 10), 96))
  root.style.setProperty('--dark-text-body', hslToRgbString(h, Math.min(s, 8), 80))
  root.style.setProperty('--dark-text-muted', hslToRgbString(h, Math.min(s, 12), 55))
}

// ── Singleton ──
const DEFAULT_COLOR = '#6366f1'
const primaryColor = useStorage('theme:primary-color', DEFAULT_COLOR)

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
})
const toggleDark = useToggle(isDark)

export function useTheme() {
  function init(): void {
    applyTheme(primaryColor.value)
    watch(primaryColor, (c) => applyTheme(c))
  }

  function setPrimaryColor(hex: string): void {
    primaryColor.value = hex
  }

  return { isDark, toggleDark, primaryColor, init, setPrimaryColor }
}
