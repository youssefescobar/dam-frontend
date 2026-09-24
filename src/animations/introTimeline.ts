import gsap from 'gsap'
import { animationConfig as motion } from './config'

export type IntroElements = {
  root: HTMLElement
  stage: HTMLElement
  logo: SVGSVGElement
  petalFlights: SVGSVGElement[]
  target: HTMLElement
  cornerLogo: HTMLElement
  overlay: HTMLElement
  hint: HTMLElement
  brandName: HTMLElement
  nav: HTMLElement
  navBar: HTMLElement
  navItems: HTMLElement[]
  heroLines: HTMLElement[]
  videoLayer: HTMLElement
  videoStage: HTMLElement
  heroCard: HTMLElement
  aiChat: HTMLElement
  playVideo: () => void
}

type Destination = { x: number; y: number; scale: number }

function destinationFor(logo: SVGSVGElement, target: HTMLElement): Destination {
  const to = target.getBoundingClientRect()
  const flight = logo.parentElement?.getBoundingClientRect()
  const width = logo.clientWidth
  const centerX = flight ? flight.left + flight.width / 2 : window.innerWidth / 2
  const centerY = flight ? flight.top + flight.height / 2 : window.innerHeight / 2

  return {
    x: to.left + to.width / 2 - centerX,
    y: to.top + to.height / 2 - centerY,
    scale: to.width / width,
  }
}

export function setIntroFinalState(elements: IntroElements) {
  gsap.set(elements.logo, { opacity: 0 })
  gsap.set(elements.petalFlights, { opacity: 0 })
  gsap.set(elements.cornerLogo, { opacity: 1, visibility: 'visible' })
  gsap.set(elements.overlay, { opacity: 0, visibility: 'hidden' })
  gsap.set(elements.hint, { opacity: 0 })
  gsap.set(elements.brandName, { opacity: 0, visibility: 'hidden' })
  gsap.set(elements.nav, { visibility: 'visible' })
  gsap.set(elements.navBar, { scaleX: 1, opacity: 1 })
  gsap.set(elements.navItems, { x: 0, opacity: 1 })
  gsap.set(elements.heroLines, { yPercent: 0, opacity: 1 })
  gsap.set(elements.videoLayer, { opacity: 1 })
  gsap.set(elements.videoStage, {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    filter: 'blur(0px)',
    clearProps: 'clipPath',
  })
  gsap.set(elements.heroCard, { opacity: 1, y: 0, scale: 1, rotate: 0 })
  gsap.set(elements.aiChat, {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    rotate: 0,
    visibility: 'visible',
    pointerEvents: 'auto',
  })
}

export function createIntroTimeline(elements: IntroElements) {
  const petals = Array.from(elements.logo.querySelectorAll<SVGGElement>('.petal'))
  const destination = () => destinationFor(elements.logo, elements.target)
  let state: 'start' | 'forward' | 'end' = 'start'
  let touchStartY = 0

  gsap.set(petals, { clearProps: 'transform', opacity: 1 })
  gsap.set(elements.logo, {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    transformOrigin: 'center center',
  })
  gsap.set(elements.petalFlights, {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 0,
    transformOrigin: 'center center',
  })
  gsap.set(elements.cornerLogo, { opacity: 0, visibility: 'visible' })
  gsap.set(elements.nav, { visibility: 'visible' })
  gsap.set(elements.navBar, { scaleX: 0, opacity: 0, transformOrigin: 'left center' })
  gsap.set(elements.navItems, { x: -12, opacity: 0 })
  gsap.set(elements.heroLines, { yPercent: 115, opacity: 0 })
  gsap.set(elements.videoLayer, { opacity: 0 })
  gsap.set(elements.videoStage, {
    opacity: 0,
    y: 64,
    scale: 0.86,
    rotate: -2.5,
    filter: 'blur(14px)',
    transformOrigin: '65% 55%',
    clipPath: 'inset(18% 22% 18% 22% round 28px)',
  })
  gsap.set(elements.heroCard, {
    opacity: 0,
    y: 36,
    scale: 0.94,
    rotate: 1.5,
    transformOrigin: 'left center',
  })
  gsap.set(elements.aiChat, {
    opacity: 0,
    scale: 0.2,
    y: 48,
    x: 28,
    rotate: -28,
    visibility: 'hidden',
    pointerEvents: 'none',
    transformOrigin: 'center center',
  })
  gsap.set(elements.brandName, { opacity: 1, y: 0, visibility: 'visible' })

  const unlockScroll = () => document.body.classList.remove('is-transitioning')
  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: motion.ease.inOut },
    onComplete: () => {
      state = 'end'
      unlockScroll()
    },
  })

  timeline
    .to(
      elements.hint,
      { opacity: 0, y: -10, duration: 0.12, ease: motion.ease.soft },
      0,
    )
    .to(
      elements.overlay,
      { opacity: 0, duration: motion.intro.overlayFadeDuration, ease: motion.ease.inOut },
      motion.intro.overlayFadeStart,
    )
    .to(
      elements.brandName,
      { opacity: 0, y: -12, duration: 0.24, ease: motion.ease.soft },
      0,
    )
    .call(elements.playVideo, [], motion.video.introStart)
    .to(
      elements.videoLayer,
      {
        opacity: 1,
        duration: motion.video.fadeDuration,
        ease: motion.ease.inOut,
      },
      motion.video.introStart,
    )
    .to(
      elements.videoStage,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        filter: 'blur(0px)',
        clipPath: 'inset(0% 0% 0% 0% round 28px)',
        duration: motion.videoFrame.revealDuration,
        ease: 'power3.out',
      },
      motion.videoFrame.revealStart,
    )
    .to(
      elements.heroCard,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: motion.glass.cardRevealDuration,
        ease: motion.ease.soft,
      },
      motion.glass.cardRevealStart,
    )
    .set(elements.logo, { opacity: 0 }, motion.intro.petalStart)
    .set(elements.petalFlights, { opacity: 1 }, motion.intro.petalStart)
    .set(
      elements.aiChat,
      { visibility: 'visible', pointerEvents: 'auto' },
      motion.aiChat.revealStart,
    )
    .to(
      elements.aiChat,
      {
        opacity: 1,
        scale: 1.12,
        y: -6,
        x: 0,
        rotate: 8,
        duration: motion.aiChat.revealDuration * 0.55,
        ease: 'back.out(2.4)',
      },
      motion.aiChat.revealStart,
    )
    .to(
      elements.aiChat,
      {
        scale: 1,
        y: 0,
        rotate: 0,
        duration: motion.aiChat.revealDuration * 0.45,
        ease: 'power2.out',
      },
      motion.aiChat.revealStart + motion.aiChat.revealDuration * 0.5,
    )

  elements.petalFlights.forEach((petal, index) => {
    const start = motion.intro.petalStart + index * motion.intro.petalTravelStagger
    timeline
      .to(
        petal,
        {
          duration: motion.intro.logoTravelDuration,
          x: () => destination().x,
          ease: 'power3.inOut',
        },
        start,
      )
      .to(
        petal,
        {
          duration: motion.intro.logoTravelDuration,
          y: () => destination().y,
          scale: () => destination().scale,
          ease: motion.ease.inOut,
        },
        start,
      )
  })

  timeline
    .to(
      elements.heroLines,
      {
        yPercent: 0,
        opacity: 1,
        duration: motion.intro.heroLineDuration,
        stagger: motion.intro.heroLineStagger,
        ease: motion.ease.soft,
      },
      motion.intro.heroStart,
    )
    .to(
      elements.petalFlights,
      { opacity: 0, duration: motion.intro.logoHandoffDuration, ease: motion.ease.inOut },
      motion.intro.logoHandoffStart,
    )
    .to(
      elements.cornerLogo,
      { opacity: 1, duration: motion.intro.logoHandoffDuration, ease: motion.ease.inOut },
      motion.intro.logoHandoffStart,
    )
    .to(
      elements.navBar,
      {
        scaleX: 1,
        opacity: 1,
        duration: motion.intro.navDuration,
        ease: motion.ease.soft,
      },
      motion.intro.navStart,
    )
    .to(
      elements.navItems,
      {
        x: 0,
        opacity: 1,
        duration: motion.intro.navDuration,
        stagger: motion.intro.navItemStagger,
        ease: motion.ease.soft,
      },
      motion.intro.navStart + 0.08,
    )
    .set(elements.logo, { opacity: 0 }, motion.intro.logoHandoffStart)

  const playForward = () => {
    if (state === 'forward' || state === 'end') return
    state = 'forward'
    document.body.classList.add('is-transitioning')
    timeline.play()
  }

  const onWheel = (event: WheelEvent) => {
    if (state === 'end' || state === 'forward') return
    if (event.deltaY <= 0) return
    event.preventDefault()
    playForward()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (state === 'end' || state === 'forward') return
    if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(event.key)) {
      event.preventDefault()
      playForward()
    }
  }

  const onClick = () => {
    if (state === 'end' || state === 'forward') return
    playForward()
  }

  const onTouchStart = (event: TouchEvent) => {
    touchStartY = event.touches[0]?.clientY ?? 0
  }

  const onTouchMove = (event: TouchEvent) => {
    if (state === 'end' || state === 'forward') return
    const y = event.touches[0]?.clientY ?? 0
    const delta = touchStartY - y
    if (delta < 18) return
    event.preventDefault()
    playForward()
  }

  window.addEventListener('wheel', onWheel, { passive: false, capture: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
  window.addEventListener('keydown', onKeyDown)
  elements.stage.addEventListener('click', onClick)

  return () => {
    window.removeEventListener('wheel', onWheel, { capture: true })
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove, { capture: true })
    window.removeEventListener('keydown', onKeyDown)
    elements.stage.removeEventListener('click', onClick)
    timeline.kill()
  }
}
