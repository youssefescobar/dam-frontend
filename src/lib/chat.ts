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
}

export type GuidedWelcome = {
  answer: string
  options: ChatOption[]
  reason: string
}

const GUEST_KEY = 'damic-chat-guest'
const CONV_KEY = 'damic-chat-conversation'

export function getGuestIdentity() {
  try {
    const stored = localStorage.getItem(GUEST_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as { name: string; contact: string }
      if (parsed?.contact) return parsed
    }
  } catch {
    /* ignore */
  }

  const identity = {
    name: 'Website guest',
    contact: `guest-${crypto.randomUUID?.() ?? Date.now()}@web.damic`,
  }
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(identity))
  } catch {
    /* ignore */
  }
  return identity
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

export function sendChatMessage(input: {
  text?: string
  choiceId?: string
  conversationId?: string | null
}) {
  const guest = getGuestIdentity()
  return api<ChatReply>('/chat/message', {
    method: 'POST',
    json: {
      text: input.text,
      choiceId: input.choiceId,
      conversationId: input.conversationId || undefined,
      customerName: guest.name,
      customerContact: guest.contact,
    },
  })
}
