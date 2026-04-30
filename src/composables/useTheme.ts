// src/composables/useTheme.ts
// ------------------------------------------------------------
// DECISÃO DE ARQUITETURA — Sistema de Cores Dinâmico:
//
// A abordagem convencional seria definir uma paleta fixa no
// tailwind.config.js. Aqui fazemos diferente: o useTheme recebe
// qualquer cor hex/hsl, converte para HSL, e gera todas as 11
// shades (50 a 950) matematicamente, alterando a Lightness.
//
// As shades geradas são escritas como CSS custom properties
// (--color-primary-500: R G B) diretamente no :root do documento.
// O Tailwind lê essas variáveis porque configuramos suas cores
// como rgb(var(--color-primary-*) / <alpha-value>).
//
// Resultado: trocar a cor primária em runtime → toda a UI
// atualiza instantaneamente, sem rebuildar o CSS.
// ------------------------------------------------------------

import { useDark, useStorage, useToggle } from '@vueuse/core';
import { watch } from 'vue';

// Lightness de cada shade no modelo HSL (0–100)
// Ajustados para ter bom contraste em ambos os modos
const SHADE_LIGHTNESS: Record<number, number> = {
  50: 97,
  100: 94,
  200: 87,
  300: 76,
  400: 63,
  500: 52,
  600: 43,
  700: 35,
  800: 27,
  900: 20,
  950: 13,
};

/**
 * Converte uma cor hex (#rrggbb ou #rgb) para um objeto {h, s, l}.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Normaliza #RGB → #RRGGBB
  const fullHex = hex.replace(
    /^#([a-f\d])([a-f\d])([a-f\d])$/i,
    (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
  );

  const r = parseInt(fullHex.slice(1, 3), 16) / 255;
  const g = parseInt(fullHex.slice(3, 5), 16) / 255;
  const b = parseInt(fullHex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converte HSL para uma string "R G B" compatível com
 * a sintaxe rgb(var(--x) / alpha) do Tailwind.
 */
function hslToRgbString(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)].join(
    ' '
  );
}

/**
 * Gera todas as CSS custom properties para a cor primária
 * e as aplica ao :root do documento.
 */
function applyPrimaryColor(hex: string): void {
  const { h, s } = hexToHsl(hex);
  const root = document.documentElement;

  // Reduz levemente a saturação nas extremidades para look mais natural
  const adjustedS = Math.min(s, 90);

  for (const [shade, lightness] of Object.entries(SHADE_LIGHTNESS)) {
    const rgbString = hslToRgbString(h, adjustedS, lightness);
    root.style.setProperty(`--color-primary-${shade}`, rgbString);
  }
}

// --- Composable público ---

const DEFAULT_COLOR = '#6366f1'; // indigo

// useStorage persiste a cor escolhida no localStorage
const primaryColor = useStorage('theme:primary-color', DEFAULT_COLOR);

// useDark do VueUse: lida com localStorage + classe 'dark' na <html>
// automaticamente, respeitando a preferência do sistema (prefers-color-scheme)
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
});

const toggleDark = useToggle(isDark);

export function useTheme() {
  /**
   * Inicializa o tema. Deve ser chamado uma vez em App.vue > onMounted.
   * Aplica a cor salva e configura o watcher para mudanças futuras.
   */
  function init(): void {
    applyPrimaryColor(primaryColor.value);

    // Reaplica as shades sempre que o usuário trocar a cor
    watch(primaryColor, newColor => {
      applyPrimaryColor(newColor);
    });
  }

  /**
   * Troca a cor primária em runtime.
   * @param hex - Cor no formato #rrggbb
   */
  function setPrimaryColor(hex: string): void {
    primaryColor.value = hex;
  }

  return {
    isDark,
    toggleDark,
    primaryColor,
    init,
    setPrimaryColor,
  };
}
