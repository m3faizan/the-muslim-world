import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "REACT_APP_"]);
  return {
    envPrefix: ["VITE_", "REACT_APP_"],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@assets": path.resolve(__dirname, "..", "attached_assets"),
        "@workspace/api-client-react": path.resolve(
          __dirname,
          "..",
          "lib",
          "api-client-react",
          "src",
          "index.ts",
        ),
      },
      dedupe: ["react", "react-dom"],
    },
    server: {
      port: 3000,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      // Disable HMR: the preview is served through an HTTPS reverse-proxy
      // where Vite's WebSocket can't reliably connect, which would otherwise
      // cause the client to do periodic full-page reloads. We can still pick
      // up code changes by manually refreshing the browser.
      hmr: false,
      fs: { strict: false, allow: [path.resolve(__dirname, ".."), path.resolve(__dirname)] },
    },
    preview: {
      port: 3000,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    define: {
      "process.env.REACT_APP_BACKEND_URL": JSON.stringify(
        env.REACT_APP_BACKEND_URL || "",
      ),
    },
  };
});
