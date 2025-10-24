import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const allowedHosts = env.VITE_DOMAIN ? env.VITE_DOMAIN.split(",").map((d) => d.trim()) : ["localhost"];
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    preview: {
      host: true, // mengizinkan koneksi dari luar (0.0.0.0)
      port: Number(env.VITE_PORT) || 5173,
      allowedHosts,
      //   strictPort: true,
    },
    server: {
      host: true,
      port: Number(env.VITE_PORT) || 5173,
      allowedHosts,
      // strictPort: true,
      // origin: "http://0.0.0.0:8080",
    },
  };
});
