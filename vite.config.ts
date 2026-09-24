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
          // Backend restarts (deploy) abort the proxied socket; don't treat as fatal.
          configure: (proxy) => {
            proxy.on('error', (err) => {
              if (err && (err as NodeJS.ErrnoException).code === 'ECONNABORTED') {
                return
              }
              console.warn('[vite] socket.io proxy:', err.message)
            })
            proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
              socket.on('error', (err) => {
                if ((err as NodeJS.ErrnoException).code === 'ECONNABORTED') return
                console.warn('[vite] socket.io ws:', err.message)
              })
            })
          },
        },
      },
    },
  }
})
