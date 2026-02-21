# In-browser Microservices

## Overview

The goal of this project is to port a microservices-based application (a social network) to the browser using Emscripten. It aims to study the performance of the resulting client-side port compared to the traditional server-side version.

The application being ported is the **Social Network** application from the [DeathStarBench](https://github.com/delimitrou/DeathStarBench) benchmark suite.

## Possible Improvements

This project is a POC, and many aspects could be improved. By using a single-page application, we could do away with legacy AJAX and unwanted refreshes. Integrating a proper dependency injection framework would facilitate development. Typing the project with TypeScript would make it more reliable. However, it serves as proof that this kind of project can be migrated. Testing the same approach with a larger-scale C++ project involving more business logic could be a next step.

## Server Deployment

To deploy the backend infrastructure, run the Ansible playbooks provided:

```bash
ansible-playbook install-dependencies.yaml -i inventories/main.yaml --ask-vault-pass
ansible-playbook deploy-app.yaml -i inventories/main.yaml --ask-vault-pass
```

## Development Setup

Follow these steps to build and run the application locally.

### 1. Build the Application
First, enter the development environment and run the build script.

```bash
nix develop
./build-for-client.sh
```

### 2. Configure Environment Variables
Navigate to the `convertedClient` directory and configure the `.env` file. You need to set the `VITE_WS_SERVER_ADDR` variable to point to your WebSocket server's IP address.

**Example `.env` configuration:**
```env
VITE_WS_SERVER_ADDR=ws://192.168.1.222:4444
```

### 3. Run the WebSocket Server
Start the WebSocket server located in the `ws-server` directory:

```bash
cd ws-server
PORT=4444 node server.js
```

### 4. Run the Frontend
Finally, start the Vite development server from the `convertedClient` directory:

```bash
npm run dev
```

## Compiling for Production

To compile the client-side application, simply run the build script:

```bash
./build-for-client.sh
```
