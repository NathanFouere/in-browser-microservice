# cf . https://www.digitalocean.com/community/tutorials/how-to-build-a-node-js-application-with-docker#step-3-writing-the-dockerfile

FROM node:23-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

FROM node:23-alpine AS production

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 4444
CMD ["node", "server.js"]
