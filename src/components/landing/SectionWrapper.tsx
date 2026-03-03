"use client"

import { motion, useInView } from "framer-motion"
import { useRef, type ReactNode } from "react"

export function SectionWrapper({ children, className = "", id, delay = 0 }: {
  children: ReactNode; className?: string; id?: string; delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.section
      ref={ref} id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  )
}
