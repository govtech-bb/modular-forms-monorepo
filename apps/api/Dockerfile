FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json nx.json tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/

RUN npm ci --ignore-scripts
RUN npx nx build api

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist/apps/api/ ./dist/
COPY --from=builder /app/dist/packages/ ./packages/
COPY --from=builder /app/node_modules/ ./node_modules/

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/src/main.js"]
