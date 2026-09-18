FROM node:24-bookworm

WORKDIR /app

COPY package.json package-lock.json ./
COPY functions/package.json functions/package-lock.json ./functions/
RUN npm ci && npm ci --prefix functions

COPY docker/app/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4200

ENTRYPOINT ["/entrypoint.sh"]
