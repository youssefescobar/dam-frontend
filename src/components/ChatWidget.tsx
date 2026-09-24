import { forwardRef, useState } from 'react'
import { AiChatButton } from './AiChatButton'
import { ChatPanel } from './ChatPanel'

/** FAB + backend-connected chat panel. */
export const ChatWidget = forwardRef<HTMLButtonElement>(function ChatWidget(_props, ref) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <AiChatButton
        ref={ref}
        className={open ? 'is-open' : undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      />
      <ChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
})
