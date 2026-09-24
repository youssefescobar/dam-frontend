import React, { useEffect, useMemo, useRef, useState } from 'react'
import './GradualBlur.css'

type GradualBlurProps = {
  position?: 'top' | 'bottom' | 'left' | 'right'
  strength?: number
  height?: string
  width?: string
  divCount?: number
  exponential?: boolean
  zIndex?: number
  animated?: boolean | 'scroll'
  duration?: string
  easing?: string
  opacity?: number
  curve?: 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'
  hoverIntensity?: number
  target?: 'parent' | 'page'
  className?: string
  style?: React.CSSProperties
  onAnimationComplete?: () => void
}

const CURVE_FUNCTIONS = {
  linear: (p: number) => p,
  bezier: (p: number) => p * p * (3 - 2 * p),
  'ease-in': (p: number) => p * p,
  'ease-out': (p: number) => 1 - (1 - p) ** 2,
  'ease-in-out': (p: number) =>
    p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2,
}

const getGradientDirection = (position: string) =>
  ({
    top: 'to top',
    bottom: 'to bottom',
    left: 'to left',
    right: 'to right',
  })[position] || 'to bottom'

function GradualBlur({
  position = 'bottom',
  strength = 2,
  height = '6rem',
  width,
  divCount = 5,
  exponential = false,
  zIndex = 1000,
  animated = false,
  duration = '0.3s',
  easing = 'ease-out',
  opacity = 1,
  curve = 'linear',
  hoverIntensity,
  target = 'parent',
  className = '',
  style = {},
  onAnimationComplete,
}: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(animated !== 'scroll')

  useEffect(() => {
    if (animated !== 'scroll' || !containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [animated])

  useEffect(() => {
    if (isVisible && animated === 'scroll' && onAnimationComplete) {
      const ms = Number.parseFloat(duration) * 1000
      const timer = window.setTimeout(() => onAnimationComplete(), ms)
      return () => window.clearTimeout(timer)
    }
  }, [isVisible, animated, onAnimationComplete, duration])

  const blurDivs = useMemo(() => {
    const divs = []
    const increment = 100 / divCount
    const currentStrength =
      isHovered && hoverIntensity ? strength * hoverIntensity : strength
    const curveFunc = CURVE_FUNCTIONS[curve] || CURVE_FUNCTIONS.linear

    for (let i = 1; i <= divCount; i += 1) {
      let progress = curveFunc(i / divCount)
      const blurValue = exponential
        ? 2 ** (progress * 4) * 0.0625 * currentStrength
        : 0.0625 * (progress * divCount + 1) * currentStrength

      const p1 = Math.round((increment * i - increment) * 10) / 10
      const p2 = Math.round(increment * i * 10) / 10
      const p3 = Math.round((increment * i + increment) * 10) / 10
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10

      let gradient = `transparent ${p1}%, black ${p2}%`
      if (p3 <= 100) gradient += `, black ${p3}%`
      if (p4 <= 100) gradient += `, transparent ${p4}%`

      divs.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            maskImage: `linear-gradient(${getGradientDirection(position)}, ${gradient})`,
            WebkitMaskImage: `linear-gradient(${getGradientDirection(position)}, ${gradient})`,
            backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            opacity,
            transition:
              animated && animated !== 'scroll'
                ? `backdrop-filter ${duration} ${easing}`
                : undefined,
          }}
        />,
      )
    }

    return divs
  }, [
    animated,
    curve,
    divCount,
    duration,
    easing,
    exponential,
    hoverIntensity,
    isHovered,
    opacity,
    position,
    strength,
  ])

  const isVertical = position === 'top' || position === 'bottom'
  const isPageTarget = target === 'page'
  const containerStyle: React.CSSProperties = {
    position: isPageTarget ? 'fixed' : 'absolute',
    pointerEvents: hoverIntensity ? 'auto' : 'none',
    opacity: isVisible ? 1 : 0,
    transition: animated ? `opacity ${duration} ${easing}` : undefined,
    zIndex: isPageTarget ? zIndex + 100 : zIndex,
    ...style,
  }

  if (isVertical) {
    containerStyle.height = height
    containerStyle.width = width || '100%'
    containerStyle[position] = 0
    containerStyle.left = 0
    containerStyle.right = 0
  } else {
    containerStyle.width = width || height
    containerStyle.height = '100%'
    containerStyle[position] = 0
    containerStyle.top = 0
    containerStyle.bottom = 0
  }

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${isPageTarget ? 'gradual-blur-page' : 'gradual-blur-parent'} ${className}`}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div className="gradual-blur-inner">{blurDivs}</div>
    </div>
  )
}

export default React.memo(GradualBlur)
