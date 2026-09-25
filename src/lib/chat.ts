import { api } from './api'

export type ChatOption = { id: string; label: string }

export type ChatReply = {
  conversationId: string
  status: string
  escalated: boolean
  answer: string | null
  reason: string | null
  systemMessage: string | null
  options?: ChatOption[]
  detail?: string | null
}

export type GuidedWelcome = {
  answer: string
  options: ChatOption[]
  reason: string
}

export type VisitorIdentity = {
  name: string
  email: string
  phone: string
}

export type ChatSession = {
  conversationId: string
  status: string
  customer: {
    id?: string
    name: string
    contact?: string
    email?: string | null
    phone?: string | null
  }
}

const IDENTITY_KEY = 'damic-chat-identity'
const CONV_KEY = 'damic-chat-conversation'

export function loadIdentity(): VisitorIdentity | null {
  try {
    const stored = localStorage.getItem(IDENTITY_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as VisitorIdentity
    if (parsed?.name?.trim() && parsed?.email?.trim() && parsed?.phone?.trim()) {
      return {
        name: parsed.name.trim(),
        email: parsed.email.trim().toLowerCase(),
        phone: parsed.phone.trim(),
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function saveIdentity(identity: VisitorIdentity) {
  try {
    localStorage.setItem(
      IDENTITY_KEY,
      JSON.stringify({
        name: identity.name.trim(),
        email: identity.email.trim().toLowerCase(),
        phone: identity.phone.trim(),
      }),
    )
  } catch {
    /* ignore */
  }
}

export function clearIdentity() {
  try {
    localStorage.removeItem(IDENTITY_KEY)
  } catch {
    /* ignore */
  }
}

export function loadConversationId(): string | null {
  try {
    return localStorage.getItem(CONV_KEY)
  } catch {
    return null
  }
}

export function saveConversationId(id: string | null) {
  try {
    if (id) localStorage.setItem(CONV_KEY, id)
    else localStorage.removeItem(CONV_KEY)
  } catch {
    /* ignore */
  }
}

export function fetchGuidedWelcome() {
  return api<GuidedWelcome>('/chat/guided')
}

export function startChatSession(identity: VisitorIdentity) {
  return api<ChatSession>('/chat/session', {
    method: 'POST',
    json: {
      name: identity.name.trim(),
      email: identity.email.trim().toLowerCase(),
      phone: identity.phone.trim(),
    },
  })
}

export function sendChatMessage(input: {
  text?: string
  choiceId?: string
  conversationId?: string | null
}) {
  if (!input.conversationId) {
    return Promise.reject(new Error('Start a chat session first'))
  }
  return api<ChatReply>('/chat/message', {
    method: 'POST',
    json: {
      text: input.text,
      choiceId: input.choiceId,
      conversationId: input.conversationId,
    },
  })
}
