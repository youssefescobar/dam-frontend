import { forwardRef, useCallback, useState } from 'react'
import { AiChatButton } from './AiChatButton'
import { ChatPanel } from './ChatPanel'

/** FAB + backend-connected chat panel with unread badge. */
export const ChatWidget = forwardRef<HTMLButtonElement>(function ChatWidget(_props, ref) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  const onUnread = useCallback((n: number) => {
    setUnread(n)
  }, [])

  return (
    <>
      <AiChatButton
        ref={ref}
        className={open ? 'is-open' : undefined}
        aria-expanded={open}
        unread={open ? 0 : unread}
        onClick={() => {
          setOpen((value) => {
            const next = !value
            if (next) setUnread(0)
            return next
          })
        }}
      />
      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        onUnreadChange={onUnread}
      />
    </>
  )
})
