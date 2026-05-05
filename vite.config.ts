// vite.config.ts
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv, type PluginOption, type UserConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'
  const isAnalyze = mode === 'analyze'

  return {
    base: env.VITE_BASE_URL ?? '/',

    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },

    // --- Dev Server ---
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      cors: true,
      proxy: {
        '/v0': {
          target: 'http://127.0.0.1:9199',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // --- Build ---
    build: {
      // Source maps apenas em staging/preview — nunca em prod puro
      // para não expor o código-fonte. Troque para true em staging.
      sourcemap: !isProd,

      // Alerta se um chunk ultrapassar 500kb
      chunkSizeWarningLimit: 500,

      rollupOptions: {
        output: {
          // Chunk splitting manual para maximizar cache:
          //   - vendor: libs que raramente mudam (Vue, Router, Pinia)
          //   - firebase: SDK grande, deve ter seu próprio hash
          //   - ui: código da app (muda a cada deploy)
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
            firebase: ['firebase/app', 'firebase/auth'],
          },
        },
      },
    },

    plugins: [
      vue(),

      // PWA desabilitado em dev por padrão (ativa com devOptions)
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        manifest: {
          name: 'Ultimate Starter',
          short_name: 'Starter',
          description: 'Vue 3 Ultimate Starter Template',
          id: '/',
          theme_color: '#6366f1',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: env.VITE_BASE_URL ?? '/',
          start_url: env.VITE_BASE_URL ?? '/',
          icons: [
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512x512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: 'screenshots/desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Ultimate Starter Dashboard',
            },
            {
              src: 'screenshots/mobile.png',
              sizes: '390x844',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Ultimate Starter Mobile',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          globIgnores: ['**/stats.html'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.hostname === 'localhost',
              handler: 'NetworkOnly',
            },
          ],
        },
      }),

      // Bundle Analyzer — só no modo 'analyze' (pnpm analyze)
      // Gera dist/stats.html com o breakdown visual do bundle
      ...(isAnalyze
        ? [visualizer({ filename: 'dist/stats.html', open: true, gzipSize: true }) as PluginOption]
        : []),
    ],
  }
})
