import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import {
  fetchGuidedWelcome,
  loadConversationId,
  saveConversationId,
  sendChatMessage,
  type ChatOption,
} from '../lib/chat'
import { ApiError } from '../lib/api'
import {
  connectCustomerSocket,
  disconnectCustomerSocket,
  joinConversation,
} from '../lib/socket'

type Role = 'user' | 'assistant' | 'admin' | 'system'

type UiMessage = {
  id: string
  role: Role
  text: string
}

type ChatPanelProps = {
  open: boolean
  onClose: () => void
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function mapSocketSender(sender: string): Role {
  if (sender === 'admin') return 'admin'
  if (sender === 'customer') return 'user'
  if (sender === 'system') return 'system'
  return 'assistant'
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const { t, dir } = useLanguage()
  const titleId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())

  const [messages, setMessages] = useState<UiMessage[]>([])
  const [options, setOptions] = useState<ChatOption[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [booted, setBooted] = useState(false)

  const appendMessage = useCallback((message: UiMessage) => {
    if (seenIdsRef.current.has(message.id)) return
    seenIdsRef.current.add(message.id)
    setMessages((prev) => {
      // Deduplicate identical trailing text from the same role (HTTP + socket race).
      const last = prev[prev.length - 1]
      if (
        last &&
        last.role === message.role &&
        last.text === message.text
      ) {
        return prev
      }
      return [...prev, message]
    })
  }, [])

  const scrollToEnd = useCallback(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    if (!open) return
    scrollToEnd()
    window.setTimeout(() => inputRef.current?.focus(), 80)
  }, [open, messages, options, scrollToEnd])

  // Live human agent channel
  useEffect(() => {
    if (!open || !conversationId) return

    const socket = connectCustomerSocket()
    joinConversation(conversationId)

    const onMessage = (payload: {
      sender?: string
      text?: string
      messageId?: string
      conversationId?: string
    }) => {
      if (
        payload.conversationId &&
        payload.conversationId !== conversationId
      ) {
        return
      }
      const text = String(payload.text || '').trim()
      if (!text) return
      const sender = payload.sender || 'ai'
      // Customer echoes are already shown from the HTTP send path.
      if (sender === 'customer') return

      appendMessage({
        id: payload.messageId || `sock-${uid()}`,
        role: mapSocketSender(sender),
        text,
      })

      if (sender === 'admin') {
        setClaimed(true)
        setEscalated(true)
        setOptions([])
      }
    }

    const onClaimed = (payload: { conversationId?: string }) => {
      if (payload.conversationId && payload.conversationId !== conversationId) {
        return
      }
      setClaimed(true)
      setEscalated(true)
      setOptions([])
      appendMessage({
        id: `claimed-${uid()}`,
        role: 'system',
        text: t.chat.claimed,
      })
    }

    const onEscalated = (payload: { conversationId?: string }) => {
      if (payload.conversationId && payload.conversationId !== conversationId) {
        return
      }
      setEscalated(true)
      setOptions([])
    }

    socket.on('message:new', onMessage)
    socket.on('conversation:claimed', onClaimed)
    socket.on('conversation:escalated', onEscalated)

    // Re-join after reconnects
    const onConnect = () => joinConversation(conversationId)
    socket.on('connect', onConnect)

    return () => {
      socket.off('message:new', onMessage)
      socket.off('conversation:claimed', onClaimed)
      socket.off('conversation:escalated', onEscalated)
      socket.off('connect', onConnect)
    }
  }, [open, conversationId, appendMessage, t.chat.claimed])

  useEffect(() => {
    if (!open) return
    return () => {
      // Keep socket while panel can reopen quickly; full teardown on unmount of widget only.
    }
  }, [open])

  useEffect(() => {
    return () => disconnectCustomerSocket()
  }, [])

  useEffect(() => {
    if (!open || booted) return
    let cancelled = false

    const boot = async () => {
      setBusy(true)
      setBootError(null)
      try {
        const welcome = await fetchGuidedWelcome()
        if (cancelled) return
        const welcomeMsg = { id: uid(), role: 'assistant' as const, text: welcome.answer }
        seenIdsRef.current.add(welcomeMsg.id)
        setMessages([welcomeMsg])
        setOptions(welcome.options ?? [])
        const existingId = loadConversationId()
        setConversationId(existingId)
        setBooted(true)
      } catch (err) {
        if (cancelled) return
        setBootError(err instanceof ApiError ? err.message : t.chat.error)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [open, booted, t.chat.error])

  const send = useCallback(
    async (payload: { text?: string; choiceId?: string; label?: string }) => {
      if (busy) return
      const text = payload.text?.trim()
      const choiceId = payload.choiceId
      if (!text && !choiceId) return

      setBusy(true)
      setBootError(null)
      const optimistic = payload.label || text || ''
      if (optimistic) {
        appendMessage({ id: uid(), role: 'user', text: optimistic })
      }
      setDraft('')
      setOptions([])

      try {
        const reply = await sendChatMessage({
          text: text || undefined,
          choiceId,
          conversationId,
        })
        setConversationId(reply.conversationId)
        saveConversationId(reply.conversationId)
        joinConversation(reply.conversationId)

        if (reply.escalated || reply.reason === 'claimed' || reply.reason === 'already_escalated') {
          setEscalated(true)
        }
        if (reply.reason === 'claimed') setClaimed(true)
        setOptions(reply.options ?? [])

        if (reply.escalated && reply.systemMessage) {
          appendMessage({
            id: uid(),
            role: 'system',
            text: reply.systemMessage,
          })
        } else if (reply.answer?.trim()) {
          appendMessage({
            id: uid(),
            role: 'assistant',
            text: reply.answer.trim(),
          })
        }
      } catch (err) {
        setBootError(err instanceof ApiError ? err.message : t.chat.error)
      } finally {
        setBusy(false)
      }
    },
    [appendMessage, busy, conversationId, t.chat.error],
  )

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send({ text: draft })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send({ text: draft })
    }
  }

  const resetChat = () => {
    saveConversationId(null)
    setConversationId(null)
    setMessages([])
    setOptions([])
    setEscalated(false)
    setClaimed(false)
    setBooted(false)
    setBootError(null)
    setDraft('')
    seenIdsRef.current.clear()
    disconnectCustomerSocket()
  }

  if (!open) return null

  const whoLabel = (role: Role) => {
    if (role === 'user') return t.chat.you
    if (role === 'system') return t.chat.system
    if (role === 'admin') return t.chat.agent
    return t.chat.assistant
  }

  return (
    <div
      className="chat-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      dir={dir}
    >
      <header className="chat-panel__header">
        <div className="chat-panel__heading">
          <h2 id={titleId}>{t.chat.title}</h2>
          <p>
            {claimed
              ? t.chat.claimed
              : escalated
                ? t.chat.escalated
                : t.chat.subtitle}
          </p>
        </div>
        <div className="chat-panel__actions">
          <button type="button" className="chat-panel__ghost" onClick={resetChat}>
            {t.chat.reset}
          </button>
          <button
            type="button"
            className="chat-panel__close"
            aria-label={t.chat.close}
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </header>

      <div className="chat-panel__messages" ref={listRef}>
        {messages.length === 0 && !busy && !bootError ? (
          <p className="chat-panel__hint">{t.chat.empty}</p>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-bubble chat-bubble--${message.role}`}
          >
            <span className="chat-bubble__who">{whoLabel(message.role)}</span>
            <p>{message.text}</p>
          </div>
        ))}

        {busy ? <p className="chat-panel__hint">{t.chat.sending}</p> : null}
        {bootError ? <p className="chat-panel__error">{bootError}</p> : null}
      </div>

      {options.length > 0 && !escalated ? (
        <div className="chat-panel__options">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={busy}
              onClick={() => void send({ choiceId: option.id, label: option.label })}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      <form className="chat-panel__composer" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          rows={2}
          value={draft}
          disabled={busy}
          placeholder={t.chat.placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" disabled={busy || !draft.trim()}>
          {t.chat.send}
        </button>
      </form>
    </div>
  )
}
