import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Si VITE_API_PROXY está definido, las llamadas a /api se redirigen al backend local.
      proxy: env.VITE_API_PROXY
        ? { '/api': { target: env.VITE_API_PROXY, changeOrigin: true } }
        : undefined,
    },
  }
})
