import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import videoSrc from '../assets/backvid.mp4?url'
import { animationConfig as motion } from '../animations/config'

export type HeroVideoHandle = {
  container: HTMLDivElement | null
  playOnce: () => void
}

type HeroVideoProps = {
  reducedMotion: boolean
}

/** Wall-clock seconds of video rewound per real second (seek-and-wait). */
const REVERSE_RATE = 16

export const HeroVideo = forwardRef<HeroVideoHandle, HeroVideoProps>(
  function HeroVideo({ reducedMotion }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const startedRef = useRef(false)
    const modeRef = useRef<'idle' | 'forward' | 'reverse'>('idle')
    const reverseRafRef = useRef(0)
    const lastTsRef = useRef(0)
    const seekingRef = useRef(false)
    const [ready, setReady] = useState(false)
    const [mobile, setMobile] = useState(
      () => window.innerWidth <= motion.video.mobileBreakpoint,
    )

    const stopReverse = useCallback(() => {
      if (reverseRafRef.current) {
        cancelAnimationFrame(reverseRafRef.current)
        reverseRafRef.current = 0
      }
      lastTsRef.current = 0
      seekingRef.current = false
    }, [])

    const startReverse = useCallback(() => {
      const video = videoRef.current
      if (!video || reducedMotion || !startedRef.current) return
      if (modeRef.current === 'reverse') return

      video.pause()
      modeRef.current = 'reverse'
      lastTsRef.current = performance.now()
      seekingRef.current = false

      const schedule = () => {
        reverseRafRef.current = requestAnimationFrame(tick)
      }

      const tick = () => {
        const current = videoRef.current
        if (!current || modeRef.current !== 'reverse') return
        if (seekingRef.current) return

        const now = performance.now()
        const dt = Math.min(0.1, (now - lastTsRef.current) / 1000)
        lastTsRef.current = now

        // Large steps so reverse feels snappy even when seeks are costly.
        const step = Math.max(0.12, dt * REVERSE_RATE)
        const next = current.currentTime - step

        if (next <= 0.02) {
          seekingRef.current = true
          const finish = () => {
            current.removeEventListener('seeked', finish)
            current.currentTime = 0
            modeRef.current = 'idle'
            seekingRef.current = false
            stopReverse()
          }
          current.addEventListener('seeked', finish)
          current.currentTime = 0
          return
        }

        seekingRef.current = true
        const onSeeked = () => {
          current.removeEventListener('seeked', onSeeked)
          seekingRef.current = false
          if (modeRef.current === 'reverse') schedule()
        }
        current.addEventListener('seeked', onSeeked)
        current.currentTime = next
      }

      schedule()
    }, [reducedMotion, stopReverse])

    const playForward = useCallback(() => {
      const video = videoRef.current
      if (!video || reducedMotion || !startedRef.current || document.hidden) return

      stopReverse()
      modeRef.current = 'forward'

      if (video.ended || video.currentTime >= video.duration - 0.05) {
        modeRef.current = 'idle'
        return
      }

      void video.play().catch(() => undefined)
    }, [reducedMotion, stopReverse])

    useImperativeHandle(
      ref,
      () => ({
        container: containerRef.current,
        playOnce: () => {
          if (startedRef.current) return
          startedRef.current = true
          playForward()
        },
      }),
      [playForward],
    )

    useEffect(() => {
      const video = videoRef.current
      const container = containerRef.current
      if (!video || !container) return

      const showLastFrame = () => {
        if (!Number.isFinite(video.duration)) return
        video.currentTime = Math.max(
          0,
          video.duration - motion.video.endFrameOffsetSeconds,
        )
      }

      const onLoadedData = () => {
        if (reducedMotion) {
          showLastFrame()
          setReady(true)
        } else {
          setReady(true)
          if (startedRef.current) playForward()
        }
      }
      const onSeeked = () => setReady(true)
      const onEnded = () => {
        modeRef.current = 'idle'
      }
      const onVisibilityChange = () => {
        if (document.hidden) {
          video.pause()
          stopReverse()
        } else if (modeRef.current === 'forward') {
          playForward()
        }
      }

      video.addEventListener('loadeddata', onLoadedData)
      video.addEventListener('seeked', onSeeked)
      video.addEventListener('ended', onEnded)
      document.addEventListener('visibilitychange', onVisibilityChange)

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!startedRef.current || reducedMotion) return

          const ratio = entry?.intersectionRatio ?? 0
          // Start reverse as soon as the hero is mostly leaving the viewport.
          const mostlyGone = !entry?.isIntersecting || ratio < 0.55

          if (mostlyGone) {
            startReverse()
          } else {
            playForward()
          }
        },
        {
          threshold: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
          rootMargin: '0px 0px -12% 0px',
        },
      )
      observer.observe(container)

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) onLoadedData()

      return () => {
        observer.disconnect()
        stopReverse()
        video.removeEventListener('loadeddata', onLoadedData)
        video.removeEventListener('seeked', onSeeked)
        video.removeEventListener('ended', onEnded)
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    }, [playForward, reducedMotion, startReverse, stopReverse])

    useEffect(() => {
      const query = window.matchMedia(
        `(max-width: ${motion.video.mobileBreakpoint}px)`,
      )
      const update = () => setMobile(query.matches)
      update()
      query.addEventListener('change', update)
      return () => query.removeEventListener('change', update)
    }, [])

    return (
      <div
        className={`hero-video${ready ? ' hero-video--ready' : ''}`}
        ref={containerRef}
        aria-hidden="true"
      >
        <video
          className="hero-video__media"
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          loop={motion.video.loop}
          style={{
            objectPosition: mobile
              ? motion.video.objectPositionMobile
              : motion.video.objectPositionDesktop,
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
    )
  },
)
