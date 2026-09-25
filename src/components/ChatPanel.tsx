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
  clearIdentity,
  fetchGuidedWelcome,
  loadIdentity,
  saveConversationId,
  saveIdentity,
  sendChatMessage,
  startChatSession,
  type ChatOption,
  type VisitorIdentity,
} from '../lib/chat'
import { playChatNotifySound } from '../lib/chatNotify'
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
  onUnreadChange?: (count: number) => void
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

function emptyIdentity(): VisitorIdentity {
  return { name: '', email: '', phone: '' }
}

export function ChatPanel({ open, onClose, onUnreadChange }: ChatPanelProps) {
  const { t, dir } = useLanguage()
  const titleId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const openRef = useRef(open)
  const unreadRef = useRef(0)

  const [identity, setIdentity] = useState<VisitorIdentity>(() => loadIdentity() || emptyIdentity())
  const [identified, setIdentified] = useState(() => Boolean(loadIdentity()))
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [options, setOptions] = useState<ChatOption[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const [booted, setBooted] = useState(false)

  openRef.current = open

  const setUnread = useCallback(
    (n: number) => {
      unreadRef.current = n
      onUnreadChange?.(n)
    },
    [onUnreadChange],
  )

  const bumpUnread = useCallback(() => {
    if (openRef.current) return
    const next = unreadRef.current + 1
    setUnread(next)
    playChatNotifySound()
  }, [setUnread])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open, setUnread])

  const appendMessage = useCallback((message: UiMessage) => {
    if (seenIdsRef.current.has(message.id)) return
    seenIdsRef.current.add(message.id)
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === message.role && last.text === message.text) {
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
    if (!open || !identified) return
    scrollToEnd()
    window.setTimeout(() => inputRef.current?.focus(), 80)
  }, [open, identified, messages, options, scrollToEnd])

  // Keep listening even when the panel is closed so badge + sound still work.
  useEffect(() => {
    if (!conversationId) return

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
      if (sender === 'customer') return

      appendMessage({
        id: payload.messageId || `sock-${uid()}`,
        role: mapSocketSender(sender),
        text,
      })
      bumpUnread()

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
      bumpUnread()
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

    const onConnect = () => joinConversation(conversationId)
    socket.on('connect', onConnect)

    return () => {
      socket.off('message:new', onMessage)
      socket.off('conversation:claimed', onClaimed)
      socket.off('conversation:escalated', onEscalated)
      socket.off('connect', onConnect)
    }
  }, [conversationId, appendMessage, bumpUnread, t.chat.claimed])

  useEffect(() => {
    return () => disconnectCustomerSocket()
  }, [])

  const beginSession = useCallback(
    async (visitor: VisitorIdentity) => {
      setBusy(true)
      setBootError(null)
      try {
        saveIdentity(visitor)
        const session = await startChatSession(visitor)
        const welcome = await fetchGuidedWelcome()

        const welcomeMsg = {
          id: uid(),
          role: 'assistant' as const,
          text: welcome.answer,
        }
        seenIdsRef.current.clear()
        seenIdsRef.current.add(welcomeMsg.id)
        setMessages([welcomeMsg])
        setOptions(welcome.options ?? [])
        setConversationId(session.conversationId)
        saveConversationId(session.conversationId)
        joinConversation(session.conversationId)
        setEscalated(false)
        setClaimed(false)
        setIdentified(true)
        setBooted(true)
        setUnread(0)
      } catch (err) {
        setBootError(err instanceof ApiError ? err.message : t.chat.error)
        throw err
      } finally {
        setBusy(false)
      }
    },
    [t.chat.error, setUnread],
  )

  useEffect(() => {
    if (!open || !identified || booted) return
    const visitor = loadIdentity()
    if (!visitor) {
      setIdentified(false)
      return
    }
    let cancelled = false
    void beginSession(visitor).catch(() => {
      if (!cancelled) setIdentified(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, identified, booted, beginSession])

  const onIdentitySubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      name: identity.name.trim(),
      email: identity.email.trim(),
      phone: identity.phone.trim(),
    }
    if (!next.name || !next.email || !next.phone) return
    setIdentity(next)
    try {
      await beginSession(next)
    } catch {
      /* bootError set */
    }
  }

  const send = useCallback(
    async (payload: { text?: string; choiceId?: string; label?: string }) => {
      if (busy || !conversationId) return
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
        let activeConversationId = conversationId
        let reply = await sendChatMessage({
          text: text || undefined,
          choiceId,
          conversationId: activeConversationId,
        })

        if (
          reply.reason === 'already_escalated' &&
          !reply.answer &&
          activeConversationId
        ) {
          const visitor = loadIdentity()
          if (visitor) {
            const session = await startChatSession(visitor)
            activeConversationId = session.conversationId
            setConversationId(activeConversationId)
            saveConversationId(activeConversationId)
            setEscalated(false)
            setClaimed(false)
            reply = await sendChatMessage({
              text: text || undefined,
              choiceId,
              conversationId: activeConversationId,
            })
          }
        }

        setConversationId(reply.conversationId)
        saveConversationId(reply.conversationId)
        joinConversation(reply.conversationId)

        if (
          reply.escalated ||
          reply.reason === 'claimed' ||
          reply.reason === 'already_escalated'
        ) {
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
    setUnread(0)
    disconnectCustomerSocket()
  }

  const changeIdentity = () => {
    clearIdentity()
    saveConversationId(null)
    setConversationId(null)
    setIdentified(false)
    setBooted(false)
    setMessages([])
    setOptions([])
    setEscalated(false)
    setClaimed(false)
    setBootError(null)
    setDraft('')
    seenIdsRef.current.clear()
    setUnread(0)
    disconnectCustomerSocket()
  }

  if (!open) return null

  const whoLabel = (role: Role) => {
    if (role === 'user') return t.chat.you
    if (role === 'system') return t.chat.system
    if (role === 'admin') return t.chat.agent
    return t.chat.assistant
  }

  const canSubmitIdentity =
    identity.name.trim() && identity.email.trim() && identity.phone.trim()

  const statusLabel = claimed
    ? t.chat.claimed
    : escalated
      ? t.chat.escalated
      : t.chat.subtitle

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
          <div className="chat-panel__title-row">
            <span className="chat-panel__live" aria-hidden />
            <h2 id={titleId}>{t.chat.title}</h2>
          </div>
          {identified ? (
            <p>
              {statusLabel}
              {' · '}
              <button type="button" className="chat-panel__inline" onClick={changeIdentity}>
                {t.chat.identityChange}
              </button>
            </p>
          ) : null}
        </div>
        <div className="chat-panel__actions">
          {identified ? (
            <button type="button" className="chat-panel__ghost" onClick={resetChat}>
              {t.chat.reset}
            </button>
          ) : null}
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

      {!identified ? (
        <form className="chat-panel__identity" onSubmit={(e) => void onIdentitySubmit(e)}>
          <h3>{t.chat.identityTitle}</h3>
          <p>{t.chat.identityLead}</p>
          <label>
            <span>{t.chat.identityName}</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              value={identity.name}
              placeholder={t.chat.identityNamePh}
              onChange={(e) => setIdentity((s) => ({ ...s, name: e.target.value }))}
            />
          </label>
          <label>
            <span>{t.chat.identityEmail}</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              autoCorrect="off"
              required
              value={identity.email}
              placeholder={t.chat.identityEmailPh}
              onChange={(e) => setIdentity((s) => ({ ...s, email: e.target.value }))}
            />
          </label>
          <label>
            <span>{t.chat.identityPhone}</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              required
              value={identity.phone}
              placeholder={t.chat.identityPhonePh}
              onChange={(e) => setIdentity((s) => ({ ...s, phone: e.target.value }))}
            />
          </label>
          {bootError ? <p className="chat-panel__error">{bootError}</p> : null}
          <button type="submit" disabled={busy || !canSubmitIdentity}>
            {busy ? t.chat.identityStarting : t.chat.identityContinue}
          </button>
        </form>
      ) : (
        <>
          <div className="chat-panel__messages" ref={listRef}>
            {messages.length === 0 && !busy && !bootError ? (
              <p className="chat-panel__hint">{t.chat.empty}</p>
            ) : null}

            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`chat-bubble chat-bubble--${message.role}`}
                style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
              >
                <span className="chat-bubble__who">{whoLabel(message.role)}</span>
                <p>{message.text}</p>
              </div>
            ))}

            {busy ? (
              <div className="chat-typing" aria-live="polite">
                <span />
                <span />
                <span />
              </div>
            ) : null}
            {bootError ? <p className="chat-panel__error">{bootError}</p> : null}
          </div>

          {options.length > 0 && !escalated ? (
            <div className="chat-panel__options">
              {options.map((option, i) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={busy}
                  style={{ animationDelay: `${i * 40}ms` }}
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
              disabled={busy || !conversationId}
              placeholder={t.chat.placeholder}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
            />
            <button type="submit" disabled={busy || !draft.trim() || !conversationId}>
              {t.chat.send}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
