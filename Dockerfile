# Install dependencies only when needed
FROM node:18 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY --link package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN npm config set registry http://registry.npmjs.org/
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps --link /app/node_modules ./node_modules
COPY --link  . .

ENV UPLOADTHING_SECRET=sk_live_043b28078c28ba8bd4185e1adb60a92c1f1cf61eea8cd79b0eb733f1fca73d45
ENV UPLOADTHING_APP_ID=8p4f4s4ifz

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
RUN \
  addgroup --system --gid 1001 nodejs; \
  adduser --system --uid 1001 nextjs

COPY --from=builder --link /app/public ./public
COPY --from=builder --link --chown=1001:1001 /app/.next/standalone ./
COPY --from=builder --link --chown=1001:1001 /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV=production
ENV UPLOADTHING_SECRET=sk_live_043b28078c28ba8bd4185e1adb60a92c1f1cf61eea8cd79b0eb733f1fca73d45
ENV UPLOADTHING_APP_ID=8p4f4s4ifz

RUN mkdir -p /app/node_modules/@xenova/.cache/
RUN chmod 777 -R /app/node_modules/@xenova/

CMD ["node", "server.js"]
