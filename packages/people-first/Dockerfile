FROM node:18-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

RUN npm install -g serve

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["serve", "-s", "dist", "--listen", "8080"]
