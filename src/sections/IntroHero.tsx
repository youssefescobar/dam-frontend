import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { LogoMark } from '../components/LogoMark'
import { HeroVideo, type HeroVideoHandle } from '../components/HeroVideo'
import { AiChatButton } from '../components/AiChatButton'
import { ExploreButton } from '../components/ExploreButton'
import { GlassCard } from '../components/glass'
import GradualBlur from '../components/effects/GradualBlur'
import { animationConfig as motion } from '../animations/config'
import {
  createIntroTimeline,
  setIntroFinalState,
  type IntroElements,
} from '../animations/introTimeline'
import { useSmoothScroll } from '../animations/useSmoothScroll'
import { SiteBelow } from './SiteBelow'

function waitForPageAssets(root: HTMLElement) {
  const fonts = document.fonts?.ready ?? Promise.resolve()
  const images = Array.from(root.querySelectorAll('img')).map((image) => {
    if (image.complete) return image.decode?.().catch(() => undefined) ?? Promise.resolve()
    return new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true })
      image.addEventListener('error', () => resolve(), { once: true })
    })
  })
  const videos = Array.from(root.querySelectorAll('video')).map((video) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve()
    return new Promise<void>((resolve) => {
      video.addEventListener('loadeddata', () => resolve(), { once: true })
      video.addEventListener('error', () => resolve(), { once: true })
    })
  })

  return Promise.all([fonts, ...images, ...videos])
}

export function IntroHero() {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<SVGSVGElement>(null)
  const petalFlightRefs = useRef<SVGSVGElement[]>([])
  const targetRef = useRef<HTMLDivElement>(null)
  const cornerLogoRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const loaderStatusRef = useRef<HTMLDivElement>(null)
  const loaderLettersRef = useRef<HTMLSpanElement[]>([])
  const brandNameRef = useRef<HTMLDivElement>(null)
  const brandWordsRef = useRef<HTMLSpanElement[]>([])
  const navRef = useRef<HTMLElement>(null)
  const navBarRef = useRef<HTMLDivElement>(null)
  const navItemsRef = useRef<HTMLElement[]>([])
  const heroLinesRef = useRef<HTMLElement[]>([])
  const heroVideoRef = useRef<HeroVideoHandle>(null)
  const heroCardRef = useRef<HTMLDivElement>(null)
  const videoStageRef = useRef<HTMLDivElement>(null)
  const aiChatRef = useRef<HTMLAnchorElement>(null)
  const [prefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [loaded, setLoaded] = useState(prefersReducedMotion)

  useSmoothScroll(!loaded || prefersReducedMotion)

  const collectNavItem = (element: HTMLElement | null) => {
    if (element && !navItemsRef.current.includes(element)) navItemsRef.current.push(element)
  }
  const collectHeroLine = (element: HTMLElement | null) => {
    if (element && !heroLinesRef.current.includes(element)) heroLinesRef.current.push(element)
  }

  const getElements = (): IntroElements | null => {
    if (
      !rootRef.current ||
      !stageRef.current ||
      !logoRef.current ||
      petalFlightRefs.current.length !== 5 ||
      !targetRef.current ||
      !cornerLogoRef.current ||
      !overlayRef.current ||
      !hintRef.current ||
      !brandNameRef.current ||
      !navRef.current ||
      !navBarRef.current ||
      !heroVideoRef.current?.container ||
      !heroCardRef.current ||
      !videoStageRef.current ||
      !aiChatRef.current
    ) {
      return null
    }

    return {
      root: rootRef.current,
      stage: stageRef.current,
      logo: logoRef.current,
      petalFlights: petalFlightRefs.current,
      target: targetRef.current,
      cornerLogo: cornerLogoRef.current,
      overlay: overlayRef.current,
      hint: hintRef.current,
      brandName: brandNameRef.current,
      nav: navRef.current,
      navBar: navBarRef.current,
      navItems: navItemsRef.current,
      heroLines: heroLinesRef.current,
      videoLayer: heroVideoRef.current.container,
      videoStage: videoStageRef.current,
      heroCard: heroCardRef.current,
      aiChat: aiChatRef.current,
      playVideo: () => heroVideoRef.current?.playOnce(),
    }
  }

  useLayoutEffect(() => {
    const elements = getElements()
    if (!elements) return

    if (prefersReducedMotion) {
      setIntroFinalState(elements)
      return
    }

    let cancelled = false
    const startedAt = performance.now()
    const petals = Array.from(elements.logo.querySelectorAll<SVGGElement>('.petal'))
    const petalOrder = ['petal-4', 'petal-2', 'petal-1', 'petal-3', 'petal-5']
      .map((id) => elements.logo.querySelector<SVGGElement>(`#${id}`))
      .filter((petal): petal is SVGGElement => petal !== null)
    const loaderStatus = loaderStatusRef.current
    const loaderLetters = loaderLettersRef.current
    const brandWords = brandWordsRef.current
    let reveal: gsap.core.Timeline | undefined
    document.body.classList.add('is-loading')

    gsap.set(petals, {
      opacity: 0,
      scale: 0.12,
      rotation: (index) => (index % 2 ? -1 : 1) * motion.loader.bloomRotation,
      transformOrigin: '427.5px 427.5px',
    })
    gsap.set(elements.logo, { rotation: -150, scale: 0.7, transformOrigin: 'center center' })
    gsap.set(elements.hint, { opacity: 0, y: 8 })
    gsap.set(loaderStatus, { opacity: 1, visibility: 'visible' })
    gsap.set(loaderLetters, { opacity: 1, y: 0 })
    gsap.set(elements.brandName, { opacity: 0, visibility: 'visible' })
    gsap.set(brandWords, { opacity: 0, y: 18 })

    const bloom = gsap.timeline()
      .to(elements.logo, {
        rotation: 0,
        scale: 1,
        duration: motion.loader.spinDuration,
        ease: 'expo.out',
      })
      .to(petalOrder, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: motion.loader.bloomDuration,
        stagger: motion.loader.bloomStagger,
        ease: motion.ease.soft,
      }, 0.12)

    const breathing = gsap.to(elements.logo, {
      scale: motion.loader.breatheScale,
      duration: motion.loader.breatheDuration,
      delay: motion.loader.spinDuration,
      repeat: -1,
      yoyo: true,
      ease: motion.ease.inOut,
    })

    const loadingPulse = gsap.timeline({ repeat: -1, yoyo: true })
      .to(loaderLetters, {
        opacity: 0.28,
        y: -2,
        duration: motion.loader.loadingPulseDuration,
        stagger: 0.07,
        ease: 'sine.inOut',
      })

    const finishLoading = async () => {
      await waitForPageAssets(elements.root)
      const remaining = Math.max(0, motion.loader.minimumMs - (performance.now() - startedAt))
      await new Promise((resolve) => window.setTimeout(resolve, remaining))
      if (cancelled) return

      bloom.kill()
      breathing.kill()
      loadingPulse.kill()
      gsap.set(elements.logo, { scale: 1 })
      reveal = gsap.timeline({
        onComplete: () => {
          document.body.classList.remove('is-loading')
          setLoaded(true)
        },
      })
        .to(loaderLetters, {
          opacity: 0,
          y: -8,
          duration: 0.22,
          stagger: 0.025,
          ease: motion.ease.soft,
        })
        .set(loaderStatus, { visibility: 'hidden' })
        .to(elements.brandName, { opacity: 1, duration: 0.2 }, '-=0.05')
        .to(brandWords, {
          opacity: 1,
          y: 0,
          duration: motion.loader.companyRevealDuration,
          stagger: motion.loader.companyWordStagger,
          ease: motion.ease.soft,
        }, '<')
        .to(elements.hint, {
          opacity: 1,
          y: 0,
          duration: motion.loader.hintDuration,
          ease: motion.ease.soft,
        }, '-=0.2')
    }

    void finishLoading()

    return () => {
      cancelled = true
      bloom.kill()
      breathing.kill()
      loadingPulse.kill()
      reveal?.kill()
      document.body.classList.remove('is-loading')
    }
  }, [prefersReducedMotion])

  useLayoutEffect(() => {
    if (!loaded || prefersReducedMotion) return
    const elements = getElements()
    if (!elements) return
    return createIntroTimeline(elements)
  }, [loaded, prefersReducedMotion])

  return (
    <section className="intro" ref={rootRef}>
      <div
        className="intro__stage"
        ref={stageRef}
        style={{ '--blob-duration': `${motion.ambient.blobDurationSeconds}s` } as CSSProperties}
      >
        <div className="hero" aria-labelledby="hero-title">
          <div className="hero__ambient" aria-hidden="true">
            <span className="hero__blob hero__blob--one" />
            <span className="hero__blob hero__blob--two" />
          </div>

          <div className="hero__layout">
            <div className="hero__blend">
              <GlassCard className="hero__glass" ref={heroCardRef}>
                <div className="hero__content">
                  <p className="hero__eyebrow line-mask">
                    <span ref={collectHeroLine}>Durrah Al Munawwara Transportation</span>
                  </p>
                  <h1 id="hero-title">
                    <span className="line-mask">
                      <span ref={collectHeroLine}>Moving you</span>
                    </span>
                    <span className="line-mask">
                      <span ref={collectHeroLine}>forward</span>
                    </span>
                  </h1>
                  <p className="hero__sub line-mask">
                    <span ref={collectHeroLine}>Premium journeys, thoughtfully driven across every mile.</span>
                  </p>
                  <div className="line-mask line-mask--cta">
                    <ExploreButton className="hero__cta" href="#services" ref={collectHeroLine}>
                      Explore our services
                    </ExploreButton>
                  </div>
                </div>
              </GlassCard>

              <div className="hero__stage-wrap" ref={videoStageRef}>
                <div
                  className="hero__stage"
                  style={{ borderRadius: motion.videoFrame.radius }}
                >
                  <HeroVideo ref={heroVideoRef} reducedMotion={prefersReducedMotion} />
                  <div className="hero__stage-fade" aria-hidden="true" />
                  <div className="hero__stage-seam" aria-hidden="true" />
                  <GradualBlur
                    target="parent"
                    position="left"
                    height={motion.videoBleed.left}
                    strength={motion.videoBleed.strength * 1.25}
                    divCount={motion.videoBleed.divCount}
                    curve="bezier"
                    exponential
                    opacity={1}
                    zIndex={3}
                  />
                  <GradualBlur
                    target="parent"
                    position="top"
                    height={motion.videoBleed.top}
                    strength={motion.videoBleed.strength * 0.9}
                    divCount={motion.videoBleed.divCount}
                    curve="bezier"
                    opacity={1}
                    zIndex={3}
                  />
                  <GradualBlur
                    target="parent"
                    position="bottom"
                    height={motion.videoBleed.bottom}
                    strength={motion.videoBleed.strength * 0.9}
                    divCount={motion.videoBleed.divCount}
                    curve="bezier"
                    opacity={1}
                    zIndex={3}
                  />
                </div>
              </div>

              <div className="hero__blend-edge" aria-hidden="true" />
            </div>
          </div>

          <GradualBlur
            target="parent"
            position="bottom"
            height="8rem"
            strength={2.4}
            divCount={8}
            curve="bezier"
            exponential
            opacity={1}
            zIndex={12}
            className="hero__page-blur"
          />
        </div>

        <div className="loader-surface" ref={overlayRef} aria-hidden="true" />
      </div>

      <SiteBelow />

      <div className="logo-flight" aria-hidden="true">
        <LogoMark className="logo-flight__mark logo-flight__mark--main" ref={logoRef} />
        {([4, 2, 1, 3, 5] as const).map((petal, index) => (
          <LogoMark
            className="logo-flight__mark logo-flight__petal-mark"
            idPrefix={`flight-${petal}`}
            key={petal}
            visiblePetal={petal}
            ref={(element) => {
              if (element) petalFlightRefs.current[index] = element
            }}
          />
        ))}
      </div>
      <div className="loader-status" ref={loaderStatusRef} aria-label="Loading">
        {'LOADING'.split('').map((letter, index) => (
          <span
            aria-hidden="true"
            key={`${letter}-${index}`}
            ref={(element) => {
              if (element) loaderLettersRef.current[index] = element
            }}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="loader-brand" ref={brandNameRef} aria-hidden="true">
        {['DURRAH', 'AL', 'MUNAWWARA', 'TRANSPORTATION'].map((word, index) => (
          <span
            key={word}
            ref={(element) => {
              if (element) brandWordsRef.current[index] = element
            }}
          >
            {word}
          </span>
        ))}
      </div>
      <div className="corner-target" ref={targetRef} aria-hidden="true" />
      <button
        className="corner-logo"
        ref={cornerLogoRef}
        type="button"
        aria-label="Damic — back to top"
      >
        <LogoMark className="logo-mark logo-mark--live" idPrefix="corner" />
      </button>

      <nav className="site-nav" ref={navRef} aria-label="Primary navigation">
        <div className="site-nav__bar" ref={navBarRef}>
          <div className="site-nav__links">
            {['Home', 'Services', 'Fleet', 'About', 'Contact'].map((item) => (
              <a href={`#${item.toLowerCase()}`} key={item} ref={collectNavItem}>
                {item}
              </a>
            ))}
          </div>
          <a className="site-nav__quote" href="#quote" ref={collectNavItem}>
            Get a Quote
          </a>
          <button
            className="menu-hook"
            type="button"
            aria-label="Menu (coming soon)"
            ref={collectNavItem}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className="scroll-hint" ref={hintRef} aria-hidden="true">
        <span>Scroll to enter</span>
        <i />
      </div>

      <AiChatButton href="#chat" ref={aiChatRef} />
    </section>
  )
}
