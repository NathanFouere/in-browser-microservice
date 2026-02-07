FROM emscripten/emsdk:latest AS emscripten-builder
WORKDIR /app

COPY convertedMicroServices/CMakeLists.txt .
COPY convertedMicroServices/src ./src
RUN emcmake cmake .
RUN emmake make


FROM node:20-alpine AS frontend
WORKDIR /app

COPY convertedClient .
RUN npm ci

COPY --from=emscripten-builder /app/convertedMicroServices.js ./wasm/convertedMicroServices.js
COPY --from=emscripten-builder /app/convertedMicroServices.wasm ./wasm/convertedMicroServices.wasm

RUN npm run build

FROM node:20-alpine AS production

COPY --from=frontend /app .

EXPOSE 3000
ENV VITE_WS_SERVER_ADDR=nathan-fouere.com/in-browser-microservice/ws-server

CMD ["npm", "run", "preview"]
