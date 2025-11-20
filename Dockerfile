# Etapa 1: instalar dependências
FROM node:20-alpine AS deps
WORKDIR /app

# Se você usa npm com package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

# Se você usa yarn, comente as duas linhas de cima e descomente:
# COPY package.json yarn.lock ./
# RUN yarn install --frozen-lockfile

# Se usa pnpm, ajusta conforme seu lockfile.


# Etapa 2: build
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Etapa 3: runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# usuário não-root
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -D nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
