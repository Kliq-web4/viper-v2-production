import React from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

/****
 * LiquidBackground
 * A light-weight, GPU-friendly background with animated blurred blobs and optional goo effect.
 * Renders absolutely positioned radial gradients that morph over time for a subtle liquid feel.
 */
export type LiquidBackgroundProps = {
  className?: string
  /** Overall opacity 0-1 */
  opacity?: number
  /** Animation speed multiplier (1 = default) */
  speed?: number
  /** Color stops for the blobs */
  colors?: string[]
}

export function LiquidBackground({
  className,
  opacity = 0.35,
  speed = 1,
  colors = [
    'rgba(147, 51, 234, 0.9)', // purple-600
    'rgba(236, 72, 153, 0.8)', // pink-500
    'rgba(79, 70, 229, 0.8)',  // indigo-600
  ],
}: LiquidBackgroundProps) {
  // simple perpetual animation using three blobs
  const t = useMotionValue(0)
  React.useEffect(() => {
    const controls = animate(t, 1, { duration: 14 / speed, ease: 'linear', repeat: Infinity })
    return () => controls.stop()
  }, [speed])

  // create slow parametric transforms
  const x1 = useTransform(t, v => 50 + Math.sin(v * Math.PI * 2) * 22)
  const y1 = useTransform(t, v => 40 + Math.cos(v * Math.PI * 2) * 18)
  const x1Pct = useTransform(x1, v => `${v}%`)
  const y1Pct = useTransform(y1, v => `${v}%`)

  const x2 = useTransform(t, v => 60 + Math.sin(v * Math.PI * 2 * 0.7 + 1) * 28)
  const y2 = useTransform(t, v => 65 + Math.cos(v * Math.PI * 2 * 0.7 + 1) * 16)
  const x2Pct = useTransform(x2, v => `${v}%`)
  const y2Pct = useTransform(y2, v => `${v}%`)

  const x3 = useTransform(t, v => 35 + Math.sin(v * Math.PI * 2 * 0.9 + 2) * 26)
  const y3 = useTransform(t, v => 65 + Math.cos(v * Math.PI * 2 * 0.9 + 2) * 20)
  const x3Pct = useTransform(x3, v => `${v}%`)
  const y3Pct = useTransform(y3, v => `${v}%`)

  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none', overflow: 'hidden' }}
      aria-hidden
    >
      <svg width="0" height="0">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div style={{ width: '100%', height: '100%', filter: 'url(#goo)' }}>
        <motion.div
          style={{
            position: 'absolute',
            left: x1Pct,
            top: y1Pct,
            width: '42vmax',
            height: '42vmax',
            translateX: '-50%',
            translateY: '-50%',
            background: `radial-gradient(closest-side, ${colors[0]} 0%, transparent 70%)`,
            mixBlendMode: 'screen',
            filter: 'blur(24px)'
          }}
        />
        <motion.div
          style={{
            position: 'absolute',
            left: x2Pct,
            top: y2Pct,
            width: '36vmax',
            height: '36vmax',
            translateX: '-50%',
            translateY: '-50%',
            background: `radial-gradient(closest-side, ${colors[1]} 0%, transparent 70%)`,
            mixBlendMode: 'screen',
            filter: 'blur(26px)'
          }}
        />
        <motion.div
          style={{
            position: 'absolute',
            left: x3Pct,
            top: y3Pct,
            width: '34vmax',
            height: '34vmax',
            translateX: '-50%',
            translateY: '-50%',
            background: `radial-gradient(closest-side, ${colors[2]} 0%, transparent 70%)`,
            mixBlendMode: 'screen',
            filter: 'blur(28px)'
          }}
        />
      </div>
    </div>
  )
}

export default LiquidBackground
