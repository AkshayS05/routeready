"use client"

import { SectionWrapper } from "./SectionWrapper"
import { AnimatedCounter } from "./AnimatedCounter"
import { STATS } from "@/lib/landing-constants"

export function StatsBar() {
  return (
    <SectionWrapper className="py-16 border-y border-[#1a1a1a]">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
        {STATS.map((stat, i) => (
          <div key={i}>
            <div className="text-5xl md:text-6xl font-bold text-[#ff6b00]">
              <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} duration={2000} />
            </div>
            <p className="text-[#a0a0a0] mt-3 text-sm max-w-[250px] mx-auto">{stat.label}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-[#444] text-xs mt-8 px-4">
        Sources: Invoca 2024, MessageDesk 2024, Dialora 2025
      </p>
    </SectionWrapper>
  )
}
