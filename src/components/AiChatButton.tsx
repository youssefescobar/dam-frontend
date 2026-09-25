import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react'
import { LogoMark } from './LogoMark'
import { useLanguage } from '../i18n/LanguageContext'

type AiChatLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  unread?: number
}

type AiChatButtonOnlyProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined
  unread?: number
}

type AiChatButtonProps = AiChatLinkProps | AiChatButtonOnlyProps

/** Floating “chat with AI” control, branded for Damic. */
export const AiChatButton = forwardRef<HTMLAnchorElement | HTMLButtonElement, AiChatButtonProps>(
  function AiChatButton(props, ref) {
    const { t } = useLanguage()
    const unread = props.unread ?? 0
    const badge =
      unread > 0 ? (
        <span className="ai-chat-btn__badge" aria-label={`${unread} unread`}>
          {unread > 9 ? '9+' : unread}
        </span>
      ) : null

    const content = (
      <>
        {badge}
        <div className="ai-chat-btn__mark">
          <LogoMark className="ai-chat-btn__icon logo-mark logo-mark--live" idPrefix="ai-chat" />
          <span className="ai-chat-btn__brand">{t.hero.brand}</span>
        </div>
        <div className="ai-chat-btn__text">
          <span>{t.hero.chatWith}</span>
          <span>{t.hero.chatAi}</span>
        </div>
      </>
    )

    if ('href' in props && props.href) {
      const { href, className = '', unread: _u, ...rest } = props
      return (
        <a
          className={`ai-chat-btn ${className}`}
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          aria-label={t.hero.chatAria}
          {...rest}
        >
          {content}
        </a>
      )
    }

    const { className = '', unread: _u, ...rest } = props as AiChatButtonOnlyProps
    return (
      <button
        className={`ai-chat-btn ${className}`}
        type="button"
        ref={ref as React.Ref<HTMLButtonElement>}
        aria-label={t.hero.chatAria}
        {...rest}
      >
        {content}
      </button>
    )
  },
)
