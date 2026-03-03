"use client"

import { useEffect, useState, useRef } from "react"
import { useInView } from "framer-motion"

export function AnimatedCounter({
  target, duration = 2000, prefix = "", suffix = "", className = "",
}: {
  target: number; duration?: number; prefix?: string; suffix?: string; className?: string
}) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true
    const start = performance.now()
    function animate(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, target, duration])

  return <span ref={ref} className={className}>{prefix}{count}{suffix}</span>
}
