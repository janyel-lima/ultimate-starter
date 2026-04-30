# .devcontainer/Dockerfile
# Usamos a imagem oficial LTS do Node para garantir
# compatibilidade com as versões dos pacotes do projeto.
FROM node:20.24.0-bookworm-slim

# Instala ferramentas de sistema úteis para desenvolvimento
RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
    git \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Instala pnpm globalmente (alternativa mais rápida ao npm)
RUN npm install -g pnpm@9

# Define o diretório de trabalho padrão
WORKDIR /workspace

# Expõe as portas usadas pelo Vite dev server
EXPOSE 5173 4173
