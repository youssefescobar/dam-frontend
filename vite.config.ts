import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (
    env.VITE_API_URL ||
    env.VITE_API_BASE_URL ||
    'http://127.0.0.1:3000'
  ).replace(/\/$/, '')

  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
    secure: true,
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/chat': apiProxy,
        '/quotes': apiProxy,
        '/health': apiProxy,
        '/socket.io': {
          ...apiProxy,
          ws: true,
        },
      },
    },
  }
})
