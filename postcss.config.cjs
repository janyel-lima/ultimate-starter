// postcss.config.cjs
// Configuração do PostCSS para processar o Tailwind CSS e adicionar
// prefixos de vendor automaticamente para compatibilidade entre browsers.
//
// Usa extensão .cjs porque o package.json do projeto tem "type": "module",
// e o PostCSS/Vite espera CommonJS para este arquivo de configuração.

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
