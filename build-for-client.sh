cd ./convertedMicroServices
emcmake cmake
make
mkdir -p ../convertedClient/wasm
mv convertedMicroServices.js ../convertedClient/wasm/
mv convertedMicroServices.wasm ../convertedClient/wasm/
