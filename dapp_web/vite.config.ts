import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ✅ 按照 FHE 文档：确保 WASM 文件正确加载
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@zama-fhe/relayer-sdk'],
  },
}));
