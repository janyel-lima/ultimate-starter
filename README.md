# Ultimate Starter Template

Vue 3 + TypeScript + Vite + Pinia + Firebase Auth + Tailwind CSS + PWA

## Pré-requisitos

- Docker Desktop (para DevContainer)
- VS Code + extensão "Dev Containers"
- Conta no Firebase com um projeto criado

## Setup rápido (DevContainer — recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo

# 2. Abra no VS Code
code .

# 3. VS Code vai detectar o .devcontainer e perguntar:
#    "Reopen in Container" — clique e aguarde o build (~2min na 1ª vez)
#    As dependências são instaladas automaticamente (postCreateCommand)
```

O Vite dev server inicia em `http://localhost:5173` e abre no browser automaticamente.

## Variáveis de Ambiente

Copie o `.env.example` para `.env.local` e preencha com as credenciais do seu projeto Firebase:

```bash
cp .env.example .env.local
```

```env
VITE_BASE_URL=/
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

As chaves estão no Console do Firebase → Configurações do projeto → Seu aplicativo.

## Setup sem DevContainer

```bash
# Node 20+ e pnpm 9+ necessários
npm install -g pnpm@9
pnpm install
pnpm dev
```

## Build e Preview

```bash
pnpm build       # Gera o bundle em /dist
pnpm preview     # Serve o /dist localmente em :4173
```

## Deploy no GitHub Pages

1. Vá em **Settings → Pages** do repositório e selecione "GitHub Actions" como source.
2. Em **Settings → Secrets and variables → Actions**, adicione todos os `VITE_FIREBASE_*` como **secrets**.
3. Em **Variables**, adicione `VITE_BASE_URL` com o valor `/nome-do-seu-repo/`.
4. Faça push para a branch `main`. O workflow `deploy.yml` faz o resto.

## Trocar a cor primária em runtime

No Dashboard, clique no círculo colorido no header. Qualquer cor hex é aceita — as 11 shades (50 a 950) são geradas automaticamente e injetadas como CSS custom properties.

Para mudar o default, altere o valor em `src/composables/useTheme.ts`:

```typescript
const DEFAULT_COLOR = '#6366f1'; // troque aqui
```

## Estrutura de arquivos chave

```
src/
├── composables/useTheme.ts   → Sistema de cores dinâmico
├── services/firebase.ts      → Firebase Auth SDK modular
├── stores/auth.ts            → Estado global de autenticação (Pinia)
├── router/index.ts           → Rotas + guards + Hash Mode
├── views/
│   ├── LoginView.vue         → Login com email/senha e Google
│   └── DashboardView.vue     → Layout base com sidebar recolhível
vite.config.ts                → Config do Vite + PWA plugin
tailwind.config.js            → Tailwind com CSS vars dinâmicas
.devcontainer/                → DevContainer para VS Code
.github/workflows/deploy.yml  → CI/CD para GitHub Pages
```
