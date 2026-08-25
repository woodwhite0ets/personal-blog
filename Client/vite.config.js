import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // Gateway console API → knowledge-base backend (reachable locally via the
      // SSH local-forward to the gateway, see mcp-gateway docker-compose comment).
      // The rewrite mirrors the blog Caddy's handle_path /api/gateway → /api.
      '/api/gateway': {
        target: 'http://localhost:18080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gateway/, '/api'),
      },
      '/api': {
        target: 'http://localhost:3027',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3027',
        changeOrigin: true,
      },
    },
  },
})
