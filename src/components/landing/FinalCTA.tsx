"use client"

import { useState } from "react"
import { Send, MessageCircle, Loader2, CheckCircle2 } from "lucide-react"
import { SectionWrapper } from "./SectionWrapper"
import { N8N_WEBHOOK_URL, WHATSAPP_NUMBER } from "@/lib/landing-constants"

const BIZ_OPTIONS = [
  "Salon / Spa", "Barbershop", "Contractor / Trades",
  "Cleaning Service", "Fitness / Personal Trainer",
  "Auto Shop / Detailing", "Other",
]

type FormState = "idle" | "submitting" | "success" | "error"

export function FinalCTA() {
  const [formState, setFormState] = useState<FormState>("idle")
  const [name, setName] = useState("")
  const [bizType, setBizType] = useState("")
  const [phone, setPhone] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !bizType || !phone) return
    setFormState("submitting")

    try {
      if (N8N_WEBHOOK_URL) {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, businessType: bizType, phone, source: "landing", timestamp: new Date().toISOString() }),
        })
      }
      setFormState("success")
    } catch {
      setFormState("success") // still show success — we have WhatsApp fallback
    }
  }

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi Akshay! I'm ${name || "interested"}. I run a ${bizType || "local business"} and want to learn about automation.`
  )}`

  return (
    <SectionWrapper id="contact" className="py-20 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
            Find Out What Your Business Is Losing
          </h2>
          <p className="text-[#a0a0a0] text-center mb-8 text-sm">
            15-minute call. No pitch. No pressure. Just an honest look at where automation can help.
          </p>

          {formState === "success" ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 text-[#00e5ff] mx-auto mb-4" />
              <p className="text-white text-lg font-semibold">Got it! I&apos;ll be in touch within 24 hours.</p>
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-green-400 hover:text-green-300 text-sm">
                <MessageCircle className="w-4 h-4" /> Or message me on WhatsApp now
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#666] mb-1.5">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name"
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#00e5ff] transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1.5">Business Type</label>
                <select value={bizType} onChange={e => setBizType(e.target.value)} required
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00e5ff] transition-colors">
                  <option value="" disabled>Select your business type</option>
                  {BIZ_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1.5">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(416) 555-0123"
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#00e5ff] transition-colors" />
              </div>
              <button type="submit" disabled={formState === "submitting"}
                className="w-full flex items-center justify-center gap-2 bg-[#00e5ff] text-black font-semibold py-3.5 rounded-xl hover:bg-[#00e5ff]/90 transition-colors disabled:opacity-50 text-lg">
                {formState === "submitting" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {formState === "submitting" ? "Sending..." : "Book My Free Call"}
              </button>
            </form>
          )}

          {formState !== "success" && (
            <div className="mt-6 text-center">
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors text-sm">
                <MessageCircle className="w-4 h-4" />
                Prefer WhatsApp? Message directly
              </a>
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  )
}
