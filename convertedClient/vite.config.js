import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // Permet de faire une MPA . cf . https://stackoverflow.com/questions/77498366/how-do-i-setup-a-multi-page-app-using-vite
    rollupOptions: {
      input: {
        index: "index.html",
        main: "main.html",
        profile: "profile.html",
        signup: "signup.html",
      },
    },
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: ["in-browser-microservice.nathan-fouere.com"],
  },
});
