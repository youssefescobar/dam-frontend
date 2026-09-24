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
      transports: ['websocket', 'polling'],
      autoConnect: false,
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
