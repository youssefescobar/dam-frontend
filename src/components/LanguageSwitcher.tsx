import { forwardRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

/** Standalone EN/AR control — opposite the corner logo. */
export const LanguageSwitcher = forwardRef<HTMLButtonElement>(
  function LanguageSwitcher(_props, ref) {
    const { t, locale, toggleLocale, isSwitching } = useLanguage()
    const targetLang = locale === 'en' ? 'ar' : 'en'

    return (
      <button
        className="lang-switch"
        type="button"
        ref={ref}
        aria-label={t.nav.langAria}
        disabled={isSwitching}
        onClick={toggleLocale}
      >
        <span
          className="lang-switch__label"
          lang={targetLang}
          dir={targetLang === 'ar' ? 'rtl' : 'ltr'}
        >
          {t.nav.lang}
        </span>
      </button>
    )
  },
)
