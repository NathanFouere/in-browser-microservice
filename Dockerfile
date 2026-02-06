FROM emscripten/emsdk:latest AS emscripten-builder
WORKDIR /app

COPY convertedMicroServices/CMakeLists.txt .
COPY convertedMicroServices/src ./src

RUN emcmake cmake .
RUN emmake make


FROM node:23-alpine AS frontend-builder
WORKDIR /app

COPY convertedClient .

RUN npm ci

COPY --from=emscripten-builder /app/convertedMicroServices.js ./wasm/convertedMicroServices.js
COPY --from=emscripten-builder /app/convertedMicroServices.wasm ./wasm/convertedMicroServices.wasm

RUN npm run build

FROM node:23-alpine as production
WORKDIR /app

RUN npm install -g serve

COPY --from=frontend-builder /app/dist ./dist
EXPOSE 3000
ENV VITE_WS_SERVER_ADDR=nathan-fouere.com/in-browser-microservice/ws-server
CMD ["serve", "-s", "dist", "-l", "3000"]
