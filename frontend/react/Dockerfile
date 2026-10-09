# Alvo `dev`: usado pelo Compose local (Vite com hot reload, código por bind mount).
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && cat package.json package-lock.json | md5sum | cut -d' ' -f1 > node_modules/.deps-hash
COPY . .
EXPOSE 3000
CMD ["sh", "docker/dev-entrypoint.sh"]
