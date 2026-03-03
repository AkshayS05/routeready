"use client"

import { motion } from "framer-motion"
import { AnimatedCounter } from "./AnimatedCounter"
import { ArrowDown, Phone } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#00e5ff06_0%,_transparent_70%)]" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-full px-5 py-2 mb-8">
            <span className="text-[#ff6b00] font-bold text-lg">
              <AnimatedCounter target={62} suffix="%" duration={1500} />
            </span>
            <span className="text-[#a0a0a0] text-sm">of small business calls go unanswered</span>
            <span className="text-[#666] text-xs hidden sm:inline">(Industry Research, 2024)</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6"
        >
          Stop Losing Customers{" "}
          <span className="text-gradient-cyan">You&apos;re Already Paying</span>{" "}
          to Get
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-[#a0a0a0] text-lg sm:text-xl max-w-2xl mx-auto mb-10"
        >
          Every missed call, forgotten follow-up, and no-show is money leaving your business.
          We build automations that catch all of it — automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#contact" className="flex items-center gap-2 bg-[#00e5ff] text-black font-semibold px-8 py-3.5 rounded-xl hover:bg-[#00e5ff]/90 transition-colors text-lg">
            <Phone className="w-5 h-5" />
            Book Free 15-Min Call
          </a>
          <a href="#demo" className="flex items-center gap-2 text-[#a0a0a0] hover:text-white border border-[#333] px-8 py-3.5 rounded-xl transition-colors">
            See What We Build
            <ArrowDown className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
