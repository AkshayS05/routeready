"use client"

import { SectionWrapper } from "./SectionWrapper"
import { AnimatedCounter } from "./AnimatedCounter"

const TRUST_STATS = [
  { value: 80, suffix: "+", label: "Users onboarded" },
  { value: 25, suffix: "K+", label: "Interactions handled" },
  { value: 1, suffix: "", label: "VP-recognized system", prefix: "" },
]

export function Credibility() {
  return (
    <SectionWrapper className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-8">
          Built By Someone Who&apos;s Done This At Scale
        </h2>

        <p className="text-[#a0a0a0] text-center max-w-2xl mx-auto mb-12 leading-relaxed">
          These automations aren&apos;t theory. I&apos;ve built systems used by 80+ staff across
          multiple locations at a national logistics company — handling thousands of interactions monthly.
          Now I&apos;m bringing the same approach to local businesses in Brampton and Woodbridge.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {TRUST_STATS.map((s, i) => (
            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#00e5ff]">
                {i === 2 ? "VP-level" : <AnimatedCounter target={s.value} suffix={s.suffix} />}
              </div>
              <p className="text-[#666] text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
