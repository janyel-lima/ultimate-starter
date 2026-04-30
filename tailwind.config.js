// tailwind.config.js
// ------------------------------------------------------------
// Decisão de arquitetura: configuramos o Tailwind no modo
// "darkMode: 'class'" para que a troca dark/light seja
// controlada programaticamente pela classe na tag <html>.
// As cores primárias NÃO são valores fixos — elas lêem de
// variáveis CSS (--color-primary-{shade}), que são geradas
// dinamicamente pelo useTheme.ts em runtime.
// Isso nos dá a superpoder de trocar a paleta inteira
// sem rebuildar o CSS.
// ------------------------------------------------------------
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],

  // Controlado pela classe 'dark' na <html> (via VueUse/useDark)
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        // Cada shade lê de uma CSS custom property gerada pelo useTheme.ts.
        // Ex: bg-primary-500 → background-color: var(--color-primary-500)
        // Isso é possível via a função CSS var() como valor de cor.
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      // Animações utilitárias usadas nos componentes
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
      },
    },
  },

  plugins: [],
};
