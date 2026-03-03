"use client"

import { SectionWrapper } from "./SectionWrapper"
import { BUSINESS_TYPES } from "@/lib/landing-constants"

export function WhoIsFor() {
  return (
    <SectionWrapper className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
          Built For Local Service Businesses
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BUSINESS_TYPES.map((b) => (
            <div key={b.label} className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 text-center hover:border-[#00e5ff]/30 transition-colors">
              <span className="text-3xl">{b.emoji}</span>
              <p className="text-white text-sm font-medium mt-2">{b.label}</p>
            </div>
          ))}
        </div>

        <p className="text-[#a0a0a0] text-center mt-10 max-w-lg mx-auto text-sm">
          If customers call you, book with you, or pay you for a service — we can automate the parts that are costing you money.
        </p>
      </div>
    </SectionWrapper>
  )
}
