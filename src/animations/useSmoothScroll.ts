import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { animationConfig } from './config'

gsap.registerPlugin(ScrollTrigger)

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
