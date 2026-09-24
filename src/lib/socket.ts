import { io, type Socket } from 'socket.io-client'

/**
 * Socket server URL.
 * Dev: same-origin so Vite proxies `/socket.io` → live API (avoids CORS).
 * Prod: direct API host from env.
 */
function socketServerUrl() {
  if (import.meta.env.DEV) return undefined
  return (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    ''
  ).replace(/\/$/, '')
}

let socket: Socket | null = null

export function getCustomerSocket(): Socket {
  if (!socket) {
    socket = io(socketServerUrl(), {
      path: '/socket.io',
      // Dev: polling first — Vite's WS upgrade to a remote API is flaky on deploy/restart.
      // Prod: websocket first for lower latency.
      transports: import.meta.env.DEV
        ? ['polling', 'websocket']
        : ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
    })
  }
  return socket
}

export function connectCustomerSocket() {
  const s = getCustomerSocket()
  if (!s.connected) s.connect()
  return s
}

export function joinConversation(conversationId: string) {
  if (!conversationId) return
  const s = connectCustomerSocket()
  s.emit('join:conversation', { conversationId })
}

export function disconnectCustomerSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
