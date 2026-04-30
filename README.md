# Ultimate Starter

**Vue 3 · TypeScript · Vite · Pinia · Firebase Auth · Tailwind CSS · PWA**
CI/CD → GitHub Pages · Vitest · Playwright · DevContainer

> Template production-ready com autenticação completa, sistema de temas dinâmico,
> testes unitários e E2E configurados, pipeline de CI/CD e ambiente de dev em um clique.

---

## Stack

| Camada           | Tecnologia                                               |
| ---------------- | -------------------------------------------------------- |
| Framework        | Vue 3 — Composition API com `<script setup>`             |
| Linguagem        | TypeScript strict mode                                   |
| Build            | Vite 5 com code-splitting manual                         |
| Estado           | Pinia                                                    |
| Roteamento       | Vue Router 4 — Hash Mode (zero-config no GH Pages)       |
| Auth             | Firebase Auth — email/senha + Google OAuth               |
| Estilo           | Tailwind CSS v3 com paleta primária gerada em runtime    |
| Dark mode        | VueUse `useDark` — persiste preferência do usuário       |
| Notificações     | `useToast` composable próprio, sem dependências externas |
| PWA              | `vite-plugin-pwa` — installable + prompt de update       |
| Testes unitários | Vitest + Vue Testing Library                             |
| Testes E2E       | Playwright — Chromium, Firefox, Pixel 5                  |
| Lint/Format      | ESLint flat config v9 + Prettier                         |
| Dev Container    | VS Code DevContainer (Node 20 + pnpm 9)                  |
| CI/CD            | GitHub Actions — quality gate + deploy automático        |

---

## Pré-requisitos

| Opção                          | Requisito                                                |
| ------------------------------ | -------------------------------------------------------- |
| **DevContainer (recomendado)** | Docker Desktop ≥ 4 · VS Code · extensão "Dev Containers" |
| **Local**                      | Node ≥ 20 · pnpm ≥ 9                                     |

Conta Firebase com um projeto criado (gratuito — plano Spark é suficiente).

---

## Setup rápido — DevContainer

```bash
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo
code .
```

O VS Code detecta o `.devcontainer/` e exibe **"Reopen in Container"**.
Clique e aguarde o build inicial (~2 min na primeira vez).
As dependências são instaladas automaticamente pelo `postCreateCommand`.

---

## Passo a passo — iniciar em modo dev

### 1 — Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com as credenciais do seu projeto Firebase:

```env
VITE_BASE_URL=/
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> **Onde encontrar:** Firebase Console → Configurações do projeto → Seus aplicativos → app web → SDK snippet.

### 2 — Instalar dependências

```bash
pnpm install
```

### 3 — (Opcional) Firebase Auth Emulator

Desenvolva sem usar o Firebase de produção. Requer Firebase CLI:

```bash
# Instala o CLI uma única vez
npm install -g firebase-tools

# Inicia o emulator
pnpm emulator:start
```

O **Emulator UI** fica disponível em `http://localhost:4000`.
Para conectar a app ao emulator, adicione ao `.env.local`:

```env
VITE_USE_FIREBASE_EMULATOR=true
```

### 4 — Servidor de desenvolvimento

```bash
pnpm dev
```

Acesse em **`http://localhost:5173`** com HMR ativo.
No DevContainer, o browser abre automaticamente.

---

## Scripts disponíveis

```bash
# Desenvolvimento
pnpm dev               # Vite dev server em :5173 com HMR
pnpm build             # Build de produção → /dist
pnpm preview           # Serve o /dist em :4173 (idêntico ao CI)

# Qualidade
pnpm type-check        # tsc --noEmit
pnpm lint              # ESLint
pnpm format            # Prettier --write src/
pnpm format:check      # Prettier --check (usado no CI)

# Testes
pnpm test              # Vitest em modo watch (desenvolvimento)
pnpm test:coverage     # Cobertura com v8 → /coverage
pnpm test:e2e          # Playwright (requer build prévio)

# Utilitários
pnpm analyze           # Bundle visualizer → dist/stats.html
pnpm emulator:start    # Firebase Auth Emulator em :9099
```

---

## Deploy no GitHub Pages

### 1 — Configurar o repositório

Em **Settings → Pages** do repositório, selecione **Source: GitHub Actions**.

### 2 — Adicionar secrets

Em **Settings → Secrets and variables → Actions**, adicione cada variável como **Secret**:

| Secret                              | Valor           |
| ----------------------------------- | --------------- |
| `VITE_FIREBASE_API_KEY`             | Chave da API    |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Domínio de auth |
| `VITE_FIREBASE_PROJECT_ID`          | ID do projeto   |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Bucket          |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID       |
| `VITE_FIREBASE_APP_ID`              | App ID          |

Em **Variables** (não secrets), adicione:

| Variável        | Valor exemplo        |
| --------------- | -------------------- |
| `VITE_BASE_URL` | `/nome-do-seu-repo/` |

### 3 — Push para `main`

O workflow `deploy.yml` faz o build e o deploy automaticamente.
O deploy só é executado se o CI (`quality` + `e2e`) passar.

> **Recomendado:** ative branch protection em Settings → Branches → Add rule → Require status checks → `quality` e `e2e`.

---

## Autenticação

### Fluxos disponíveis

- Login com e-mail e senha
- Cadastro com e-mail e senha
- Login com Google (OAuth popup)
- Logout
- Persistência de sessão via IndexedDB (Firebase padrão)
- Guard de rota — `/dashboard` requer autenticação, `/login` redireciona usuários logados

### Como funciona a inicialização

O `authStore.init()` é chamado em `main.ts` **antes de montar o app**. Isso garante que o navigation guard já conheça o estado de auth ao processar a primeira rota, eliminando o flash de redirect.

```typescript
// main.ts
const authStore = useAuthStore()
authStore.init().then(() => {
  app.mount('#app')
})
```

---

## Sistema de temas

A paleta primária é gerada dinamicamente em runtime a partir de uma única cor hex. As 11 shades (50 → 950) são calculadas via HSL e injetadas como CSS custom properties no `:root`.

```
Escolha uma cor hex → hexToHsl() → 11 shades com lightness variável → CSS vars → Tailwind
```

O Tailwind lê as vars porque as cores estão configuradas como:

```js
primary: { 500: 'rgb(var(--color-primary-500) / <alpha-value>)' }
```

### Trocar a cor default

Edite `src/composables/useTheme.ts`:

```typescript
const DEFAULT_COLOR = '#6366f1' // qualquer hex
```

### Usar em qualquer componente

```typescript
const { toast } = useToast()
toast.success('Operação concluída!')
toast.error('Algo deu errado.')
toast.warning('Atenção: sessão expira em breve.')
toast.info('Dados sincronizados.')
```

---

## Componentes UI base

| Componente   | Localização                        | Uso                                      |
| ------------ | ---------------------------------- | ---------------------------------------- |
| `AppButton`  | `src/components/ui/AppButton.vue`  | Botão com variantes e estado de loading  |
| `AppInput`   | `src/components/ui/AppInput.vue`   | Input com label, erro e hint             |
| `AppSpinner` | `src/components/ui/AppSpinner.vue` | Spinner de loading acessível             |
| `AppToast`   | `src/components/ui/AppToast.vue`   | Container de notificações (via Teleport) |

### AppButton

```vue
<AppButton variant="primary" :loading="isLoading" full-width>
  Salvar
</AppButton>

<!-- Variantes: primary | secondary | ghost | danger -->
<!-- Sizes: sm | md | lg -->
```

### AppInput

```vue
<AppInput
  v-model="email"
  label="E-mail"
  type="email"
  placeholder="voce@exemplo.com"
  :error="emailError"
  required
/>
```

---

## Estrutura do projeto

```
.
├── .devcontainer/
│   ├── Dockerfile              → Node 20 slim + pnpm 9
│   └── devcontainer.json       → Extensões VS Code + port forwarding
├── .github/workflows/
│   ├── ci.yml                  → Lint + type-check + unit + E2E
│   └── deploy.yml              → Build + deploy GH Pages (pós-CI)
├── e2e/
│   ├── pages/
│   │   ├── login.page.ts       → Page Object Model da tela de login
│   │   └── dashboard.page.ts   → Page Object Model do dashboard
│   ├── auth.spec.ts            → Testes de autenticação ponta-a-ponta
│   └── dashboard.spec.ts       → Testes do layout do dashboard
├── public/
│   ├── favicon.svg
│   └── icons/
│       ├── icon-192x192.png    → PWA icon (gere com seu branding)
│       └── icon-512x512.png    → PWA icon maskable
├── src/
│   ├── assets/main.css         → Tailwind directives + CSS vars base
│   ├── components/ui/
│   │   ├── AppButton.vue
│   │   ├── AppInput.vue
│   │   ├── AppSpinner.vue
│   │   └── AppToast.vue        → Montado no App.vue via Teleport
│   ├── composables/
│   │   ├── useTheme.ts         → Paleta dinâmica via CSS custom properties
│   │   └── useToast.ts         → Sistema de notificações global
│   ├── directives/
│   │   └── clickOutside.ts     → v-click-outside (registrado em main.ts)
│   ├── router/
│   │   └── index.ts            → Hash Mode + navigation guards
│   ├── services/
│   │   └── firebase.ts         → SDK modular v9 — init + Auth + Emulator
│   ├── stores/
│   │   ├── auth.ts             → Estado de autenticação (Pinia)
│   │   └── __tests__/
│   │       └── auth.spec.ts
│   ├── test/
│   │   ├── mocks/
│   │   │   ├── firebase.ts     → vi.mock() para @/services/firebase
│   │   │   └── pwa.ts          → Mock do virtual:pwa-register/vue
│   │   ├── setup.ts            → Setup global do Vitest (jsdom, matchMedia...)
│   │   └── utils.ts            → renderWithPlugins, createTestRouter
│   ├── types/
│   │   └── env.d.ts            → Tipagem de import.meta.env
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── DashboardView.vue
│   │   └── __tests__/
│   │       └── LoginView.spec.ts
│   ├── App.vue                 → Root: tema + PWA + AppToast + RouterView
│   └── main.ts                 → App bootstrap: pinia → router → directive → auth → mount
├── .env.example
├── .firebaserc                 → Projeto Firebase para o CLI
├── .prettierrc
├── eslint.config.ts
├── firebase.json               → Configuração do Auth Emulator
├── index.html                  → Entry point do Vite
├── package.json
├── playwright.config.ts
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vitest.config.ts
```

---

## Variáveis de ambiente

| Variável                            | Obrigatório | Descrição                                    |
| ----------------------------------- | ----------- | -------------------------------------------- |
| `VITE_BASE_URL`                     | ✅          | Base path (`/` em dev, `/repo/` no GH Pages) |
| `VITE_FIREBASE_API_KEY`             | ✅          | Chave pública do Firebase                    |
| `VITE_FIREBASE_AUTH_DOMAIN`         | ✅          | Domínio de autenticação                      |
| `VITE_FIREBASE_PROJECT_ID`          | ✅          | ID do projeto Firebase                       |
| `VITE_FIREBASE_STORAGE_BUCKET`      | ✅          | Bucket do Storage                            |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅          | Sender ID                                    |
| `VITE_FIREBASE_APP_ID`              | ✅          | App ID                                       |
| `VITE_USE_FIREBASE_EMULATOR`        | ❌          | `'true'` para usar o Auth Emulator local     |

---

## Decisões de arquitetura

**Hash Mode no router** — O GitHub Pages serve arquivos estáticos; com History Mode um F5 em `/dashboard` retorna 404. Hash Mode resolve isso sem configuração de servidor. Para migrar para Vercel/Netlify, troque `createWebHashHistory` por `createWebHistory`.

**auth.init() antes do mount** — O Firebase Auth é assíncrono; sem aguardar o `onAuthStateChanged` inicial, o guard pode redirecionar o usuário logado para `/login` por um frame. Resolvemos isso resolvendo a Promise antes de `app.mount()`.

**CSS custom properties para temas** — A abordagem convencional seria uma paleta fixa no `tailwind.config.js`. Aqui calculamos as 11 shades matematicamente via HSL e as escrevemos como CSS vars em runtime. Resultado: troca de cor sem rebuild.

**SDK modular Firebase** — Cada função (`signInWithEmailAndPassword`, etc.) é importada individualmente. O Vite elimina do bundle qualquer parte do SDK não importada.

**Mockar `@/services/firebase`, não `firebase/auth`** — Os testes mocam nossa camada de serviço, não os internos do SDK. Se o Firebase mudar a API interna, só o service precisa de ajuste — os testes de store e view continuam funcionando.
