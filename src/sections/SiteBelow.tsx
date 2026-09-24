import type { MouseEvent } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { useSmoothScrollApi } from '../animations/useSmoothScroll'

/** Placeholder sections below the hero — replace as real pages land. */
export function SiteBelow() {
  const { t } = useLanguage()
  const { scrollTo } = useSmoothScrollApi()

  const go = (id: string) => (event: MouseEvent) => {
    event.preventDefault()
    scrollTo(`#${id}`, { offset: -88 })
  }

  return (
    <div className="site-below">
      <section className="site-section" id="services" aria-labelledby="services-title">
        <p className="site-section__eyebrow">{t.services.eyebrow}</p>
        <h2 id="services-title">{t.services.title}</h2>
        <p className="site-section__lead">{t.services.lead}</p>
        <div className="site-section__grid">
          {t.services.items.map((item) => (
            <article className="site-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section--muted" id="fleet" aria-labelledby="fleet-title">
        <p className="site-section__eyebrow">{t.fleet.eyebrow}</p>
        <h2 id="fleet-title">{t.fleet.title}</h2>
        <p className="site-section__lead">{t.fleet.lead}</p>
        <div className="site-section__row">
          {t.fleet.items.map((item) => (
            <article className="site-pill" key={item.name}>
              <h3>{item.name}</h3>
              <p>
                {item.seats}
                <span aria-hidden="true"> · </span>
                {item.note}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section" id="about" aria-labelledby="about-title">
        <p className="site-section__eyebrow">{t.about.eyebrow}</p>
        <h2 id="about-title">{t.about.title}</h2>
        <p className="site-section__lead site-section__lead--wide">{t.about.lead}</p>
        <a className="site-section__link" href="#contact" onClick={go('contact')}>
          {t.about.link}
        </a>
      </section>

      <section className="site-section site-section--footer" id="contact" aria-labelledby="contact-title">
        <p className="site-section__eyebrow">{t.contact.eyebrow}</p>
        <h2 id="contact-title">{t.contact.title}</h2>
        <p className="site-section__lead">{t.contact.lead}</p>
        <a className="site-section__link" href="#contact" onClick={go('contact')}>
          {t.contact.link}
        </a>
      </section>
    </div>
  )
}
