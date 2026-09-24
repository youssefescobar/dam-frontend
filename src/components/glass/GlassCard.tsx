import { forwardRef, type HTMLAttributes } from 'react'
import { animationConfig as motion } from '../../animations/config'

type GlassCardProps = HTMLAttributes<HTMLDivElement>

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard({ children, className = '', style, ...props }, ref) {
    return (
      <div
        className={`glass-card ${className}`}
        ref={ref}
        style={{ borderRadius: motion.glass.cardRadius, ...style }}
        {...props}
      >
        <div className="glass-card__content">{children}</div>
      </div>
    )
  },
)
