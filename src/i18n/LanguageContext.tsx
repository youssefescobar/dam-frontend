import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { messages, type Locale, type Messages } from './messages'

type LanguageContextValue = {
  locale: Locale
  t: Messages
  dir: 'ltr' | 'rtl'
  isSwitching: boolean
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'damic-locale'
const SWAP_OUT_MS = 220
const SWAP_IN_MS = 420

function readStoredLocale(): Locale {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'ar' || value === 'en') return value
  } catch {
    /* ignore */
  }
  return 'en'
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window === 'undefined' ? 'en' : readStoredLocale(),
  )
  const [isSwitching, setIsSwitching] = useState(false)
  const switchingRef = useRef(false)

  const commitLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    persistLocale(next)
    applyDocumentLocale(next)
  }, [])

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale || switchingRef.current) return
      void (async () => {
        switchingRef.current = true
        setIsSwitching(true)
        const root = document.documentElement
        const shift = next === 'ar' ? '-18px' : '18px'
        root.style.setProperty('--locale-shift', shift)
        root.classList.remove('is-locale-in')
        root.classList.add('is-locale-out')

        await new Promise((resolve) => window.setTimeout(resolve, SWAP_OUT_MS))

        commitLocale(next)
        root.classList.remove('is-locale-out')
        root.classList.add('is-locale-in')

        await new Promise((resolve) => window.setTimeout(resolve, SWAP_IN_MS))

        root.classList.remove('is-locale-in')
        root.style.removeProperty('--locale-shift')
        switchingRef.current = false
        setIsSwitching(false)
      })()
    },
    [commitLocale, locale],
  )

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'ar' : 'en')
  }, [locale, setLocale])

  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      t: messages[locale],
      dir: locale === 'ar' ? 'rtl' : 'ltr',
      isSwitching,
      setLocale,
      toggleLocale,
    }),
    [isSwitching, locale, setLocale, toggleLocale],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
