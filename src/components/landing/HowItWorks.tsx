"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { HOW_IT_WORKS } from "@/lib/landing-constants"

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="how-it-works" ref={ref} className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-14">
          How It Works
        </h2>

        <div className="space-y-10">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="flex items-start gap-5"
            >
              <div className="flex-shrink-0 w-14 h-14 bg-[#00e5ff]/10 border border-[#00e5ff]/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">{step.emoji}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-[#a0a0a0] mt-1 text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
