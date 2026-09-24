const SERVICES = [
  {
    title: 'Corporate fleet',
    copy: 'Executive shuttles and scheduled routes for teams that need to move with calm precision.',
  },
  {
    title: 'Airport transfers',
    copy: 'Meet-and-greet arrivals, live flight tracking, and quiet cabins from curb to gate.',
  },
  {
    title: 'Group journeys',
    copy: 'Coaches and mid-size buses for events, pilgrimages, and multi-city itineraries.',
  },
] as const

const FLEET = [
  { name: 'S-Class coach', seats: '49 seats', note: 'Highway comfort' },
  { name: 'Executive van', seats: '14 seats', note: 'City agile' },
  { name: 'VIP sprinter', seats: '8 seats', note: 'Private detail' },
] as const

/** Placeholder sections below the hero — replace as real pages land. */
export function SiteBelow() {
  return (
    <div className="site-below">
      <section className="site-section" id="services" aria-labelledby="services-title">
        <p className="site-section__eyebrow">Services</p>
        <h2 id="services-title">Built for every mile that matters</h2>
        <p className="site-section__lead">
          Dummy copy for now — swap these blocks as product pages and booking flows take shape.
        </p>
        <div className="site-section__grid">
          {SERVICES.map((item) => (
            <article className="site-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section--muted" id="fleet" aria-labelledby="fleet-title">
        <p className="site-section__eyebrow">Fleet</p>
        <h2 id="fleet-title">A lineup ready when you are</h2>
        <p className="site-section__lead">
          Placeholder fleet cards so the scroll rhythm is already here while specs and photos land.
        </p>
        <div className="site-section__row">
          {FLEET.map((item) => (
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
        <p className="site-section__eyebrow">About</p>
        <h2 id="about-title">Durrah Al Munawwara Transportation</h2>
        <p className="site-section__lead site-section__lead--wide">
          This band is temporary scaffolding. Keep the hero locked, then grow services, fleet, and
          contact into this stack without fighting the intro again.
        </p>
        <a className="site-section__link" href="#contact">
          Jump to contact
        </a>
      </section>

      <section className="site-section site-section--footer" id="contact" aria-labelledby="contact-title">
        <p className="site-section__eyebrow">Contact</p>
        <h2 id="contact-title">Let’s plan the next departure</h2>
        <p className="site-section__lead">
          Placeholder CTA — wire forms, WhatsApp, or booking when you’re ready.
        </p>
        <a className="site-section__link" href="#quote">
          Get a quote
        </a>
      </section>
    </div>
  )
}
