import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from 'react'
import { useSmoothScrollApi } from '../animations/useSmoothScroll'
import { useLanguage } from '../i18n/LanguageContext'

const SECTION_IDS = ['home', 'services', 'fleet', 'about', 'contact'] as const

type SiteNavProps = {
  navRef: RefObject<HTMLElement | null>
  navBarRef: RefObject<HTMLDivElement | null>
  collectNavItem: (element: HTMLElement | null) => void
}

export function SiteNav({ navRef, navBarRef, collectNavItem }: SiteNavProps) {
  const { t, dir } = useLanguage()
  const { scrollTo } = useSmoothScrollApi()
  const linksRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string>('home')
  const [pill, setPill] = useState({ left: 0, width: 0, opacity: 0 })

  const labels: Record<(typeof SECTION_IDS)[number], string> = {
    home: t.nav.home,
    services: t.nav.services,
    fleet: t.nav.fleet,
    about: t.nav.about,
    contact: t.nav.contact,
  }

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el,
    )
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const top = visible[0]?.target.id
        if (top) setActive(top)
      },
      {
        rootMargin: '-28% 0px -55% 0px',
        threshold: [0.08, 0.2, 0.4, 0.6],
      },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [t])

  useLayoutEffect(() => {
    const root = linksRef.current
    if (!root) return

    const update = () => {
      const link = root.querySelector<HTMLElement>(`[data-nav="${active}"]`)
      if (!link) {
        setPill((prev) => ({ ...prev, opacity: 0 }))
        return
      }
      setPill({
        left: link.offsetLeft,
        width: link.offsetWidth,
        opacity: 1,
      })
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [active, t, dir])

  const go = (id: string) => (event: MouseEvent) => {
    event.preventDefault()
    setActive(id)
    scrollTo(`#${id}`, { offset: id === 'home' ? 0 : -88 })
  }

  return (
    <nav className="site-nav" ref={navRef} aria-label="Primary navigation">
      <div className="site-nav__bar" ref={navBarRef}>
        <div className="site-nav__links" ref={linksRef}>
          <span
            className="site-nav__pill"
            aria-hidden="true"
            style={{
              transform: `translate3d(${pill.left}px, -50%, 0)`,
              width: pill.width,
              opacity: pill.opacity,
            }}
          />
          {SECTION_IDS.map((id) => (
            <a
              href={`#${id}`}
              key={id}
              data-nav={id}
              className={active === id ? 'is-active' : undefined}
              ref={collectNavItem}
              onClick={go(id)}
            >
              {labels[id]}
            </a>
          ))}
        </div>
        <a
          className="site-nav__quote"
          href="#contact"
          ref={collectNavItem}
          onClick={go('contact')}
        >
          {t.nav.quote}
        </a>
        <button
          className="menu-hook"
          type="button"
          aria-label={t.nav.menu}
          ref={collectNavItem}
        >
          <span />
          <span />
        </button>
      </div>
    </nav>
  )
}
