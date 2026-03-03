"use client"

import { useState, useEffect } from "react"
import { Menu, X, Zap } from "lucide-react"

const NAV_LINKS = [
  { href: "#demo", label: "Demo" },
  { href: "#pricing", label: "Pricing" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#contact", label: "Contact" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]" : "bg-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00e5ff] rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-white text-lg">Akshay Automation</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-[#a0a0a0] hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
          <a href="#contact" className="bg-[#00e5ff] text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#00e5ff]/90 transition-colors">
            Book Free Call
          </a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#1a1a1a] px-4 py-4 space-y-3">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block text-[#a0a0a0] hover:text-white py-2">
              {l.label}
            </a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)}
            className="block bg-[#00e5ff] text-black text-center font-semibold px-4 py-2.5 rounded-lg">
            Book Free Call
          </a>
        </div>
      )}
    </nav>
  )
}
