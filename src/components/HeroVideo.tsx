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

export const HeroVideo = forwardRef<HeroVideoHandle, HeroVideoProps>(
  function HeroVideo({ reducedMotion }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const startedRef = useRef(false)
    const intersectingRef = useRef(true)
    const [ready, setReady] = useState(false)
    const [mobile, setMobile] = useState(
      () => window.innerWidth <= motion.video.mobileBreakpoint,
    )

    const safelyPlay = useCallback(() => {
      const video = videoRef.current
      if (
        !video ||
        reducedMotion ||
        !startedRef.current ||
        video.ended ||
        document.hidden ||
        !intersectingRef.current
      ) {
        return
      }
      void video.play().catch(() => undefined)
    }, [reducedMotion])

    useImperativeHandle(
      ref,
      () => ({
        container: containerRef.current,
        playOnce: () => {
          if (startedRef.current) return
          startedRef.current = true
          safelyPlay()
        },
      }),
      [safelyPlay],
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
        } else {
          setReady(true)
          safelyPlay()
        }
      }
      const onSeeked = () => setReady(true)
      const onVisibilityChange = () => {
        if (document.hidden) video.pause()
        else safelyPlay()
      }

      video.addEventListener('loadeddata', onLoadedData)
      video.addEventListener('seeked', onSeeked)
      document.addEventListener('visibilitychange', onVisibilityChange)

      const observer = new IntersectionObserver(
        ([entry]) => {
          intersectingRef.current = entry?.isIntersecting ?? false
          if (intersectingRef.current) safelyPlay()
          else video.pause()
        },
        { threshold: motion.video.intersectionThreshold },
      )
      observer.observe(container)

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) onLoadedData()

      return () => {
        observer.disconnect()
        video.removeEventListener('loadeddata', onLoadedData)
        video.removeEventListener('seeked', onSeeked)
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    }, [reducedMotion, safelyPlay])

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
