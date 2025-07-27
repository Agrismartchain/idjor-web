import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Pendant le dev, proxy les appels /api vers votre prod Vercel
      "/api": {
        target: "https://idjor-web-marouanes-projects-e15c757a.vercel.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
