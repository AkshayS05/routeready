"use client"

import { useState, useCallback } from "react"
import { Play, RotateCcw } from "lucide-react"
import { SectionWrapper } from "./SectionWrapper"
import { PhoneMockup } from "./PhoneMockup"

type DemoState = "idle" | "playing" | "done"

export function LiveDemo() {
  const [state, setState] = useState<DemoState>("idle")

  const handlePlay = useCallback(() => {
    setState("playing")
    setTimeout(() => setState("done"), 8000)
  }, [])

  return (
    <SectionWrapper id="demo" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-3">
          Watch The Automation Work — <span className="text-gradient-cyan">Live</span>
        </h2>
        <p className="text-[#a0a0a0] text-center mb-10 max-w-xl mx-auto">
          This is exactly what your customers experience.
        </p>

        <div className="flex justify-center mb-10">
          <button
            onClick={state === "done" ? () => setState("idle") : handlePlay}
            disabled={state === "playing"}
            className="flex items-center gap-2 bg-[#00e5ff] text-black font-semibold px-8 py-3 rounded-full hover:bg-[#00e5ff]/90 transition-colors disabled:opacity-50 text-lg"
          >
            {state === "done" ? (
              <><RotateCcw className="w-5 h-5" /> Reset Demo</>
            ) : state === "playing" ? (
              <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Playing...</>
            ) : (
              <><Play className="w-5 h-5" /> Play Demo</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[560px] mx-auto">
          <PhoneMockup variant="without" state={state} />
          <PhoneMockup variant="with" state={state} />
        </div>
      </div>
    </SectionWrapper>
  )
}
