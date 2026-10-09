FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json ./
RUN npm ci
COPY src ./src
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev && npx prisma generate
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
