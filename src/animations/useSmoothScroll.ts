import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { animationConfig } from './config'

gsap.registerPlugin(ScrollTrigger)

type SmoothScrollContextValue = {
  scrollTo: (target: string | HTMLElement, options?: { offset?: number }) => void
  lenis: Lenis | null
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  scrollTo: () => undefined,
  lenis: null,
})

export function SmoothScrollProvider({
  disabled,
  children,
}: {
  disabled: boolean
  children: ReactNode
}) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (disabled) {
      lenisRef.current = null
      return
    }

    const lenis = new Lenis({
      duration: animationConfig.smoothScroll.duration,
      smoothWheel: true,
      touchMultiplier: 1,
    })
    lenisRef.current = lenis

    const update = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(update)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [disabled])

  const value = useMemo<SmoothScrollContextValue>(
    () => ({
      lenis: lenisRef.current,
      scrollTo: (target, options) => {
        const lenis = lenisRef.current
        if (lenis) {
          lenis.scrollTo(target, {
            offset: options?.offset ?? -88,
            duration: 1.15,
          })
          return
        }
        const el =
          typeof target === 'string' ? document.querySelector(target) : target
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
    }),
    [disabled],
  )

  return createElement(SmoothScrollContext.Provider, { value }, children)
}

export function useSmoothScrollApi() {
  return useContext(SmoothScrollContext)
}

/** @deprecated Prefer SmoothScrollProvider — kept for call sites that only need the effect. */
export function useSmoothScroll(disabled: boolean) {
  useEffect(() => {
    if (disabled) return

    const lenis = new Lenis({
      duration: animationConfig.smoothScroll.duration,
      smoothWheel: true,
      touchMultiplier: 1,
    })

    const update = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(update)
      lenis.destroy()
    }
  }, [disabled])
}
