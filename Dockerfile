FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY src ./src

RUN mkdir -p database

ENV KAFRAINBOX_HTTP_SERVER_PORT=3134
ENV KAFRAINBOX_SMTP_SERVER_PORT=1025

EXPOSE 3134
EXPOSE 1025

CMD ["bun", "src/server/index.ts"]
