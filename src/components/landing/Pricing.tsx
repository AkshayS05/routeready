"use client"

import { Check } from "lucide-react"
import { PRICING_TIERS } from "@/lib/landing-constants"
import { SectionWrapper } from "./SectionWrapper"

export function Pricing() {
  return (
    <SectionWrapper id="pricing" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-3">
          What We Build For Your Business
        </h2>
        <p className="text-[#a0a0a0] text-center mb-12 max-w-xl mx-auto">
          Real automations. Real results. No monthly Microsoft subscriptions required.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div key={tier.name} className={`rounded-2xl p-6 relative ${
              tier.badge
                ? "bg-[#111] border-2 border-[#00e5ff]"
                : "bg-[#111] border border-[#1a1a1a]"
            }`}>
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00e5ff] text-black text-xs font-bold px-3 py-1 rounded-full">
                  {tier.badge}
                </div>
              )}
              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              <p className="text-[#666] text-xs mt-1">Best for: {tier.bestFor}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">${tier.price}</span>
                <span className="text-[#a0a0a0] text-sm"> setup</span>
              </div>
              <p className="text-[#666] text-xs mt-1">
                Monthly maintenance: ${tier.monthly}/month (optional)
              </p>
              <ul className="mt-6 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                    <Check className="w-4 h-4 text-[#00e5ff] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#contact" className={`block text-center mt-6 py-3 rounded-xl font-medium transition-colors ${
                tier.badge
                  ? "bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90"
                  : "bg-[#1a1a1a] text-white hover:bg-[#222]"
              }`}>
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-[#444] text-sm mt-8">
          Not sure which plan fits? Book a free 15-min call and we&apos;ll tell you honestly what you need.
        </p>
      </div>
    </SectionWrapper>
  )
}
