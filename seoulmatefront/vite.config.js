import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",   // 🔴 아까 server.js에서 지정한 포트와 같게!
        changeOrigin: true,
      },
    },
  },
});

