# .devcontainer/Dockerfile
FROM node:24-bullseye-slim

# 1. Instala ferramentas básicas e dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    bash \
    ca-certificates \
    wget \
    && npx playwright install-deps \
    && rm -rf /var/lib/apt/lists/*

# 2. Instala o JDK 21 (Eclipse Temurin)
# Baixamos o binário direto para garantir a versão 21+
RUN mkdir -p /opt/java && \
    wget -qO- https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_linux_hotspot_21.0.2_13.tar.gz | tar -xz -C /opt/java --strip-components=1

# Configura as variáveis de ambiente do Java
ENV JAVA_HOME=/opt/java
ENV PATH=$JAVA_HOME/bin:$PATH

# 3. Instala a ULTIMA versão do pnpm e o firebase-tools
# Usar @latest garante que você sempre terá a versão mais nova
RUN npm install -g pnpm@latest firebase-tools

WORKDIR /workspace

# Portas: Vite + Firebase Emulators
EXPOSE 5173 4173 4000 8080 9099 5001

# 4. Ajuste de permissões
RUN mkdir -p /workspace && chown -R node:node /workspace

USER node
