cd ./convertedMicroServices
emcmake cmake .
make
mv convertedMicroServices.js ../convertedClient/wasm
mv convertedMicroServices.wasm ../convertedClient/wasm
