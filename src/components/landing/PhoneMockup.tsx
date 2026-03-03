"use client"

import { PhoneMissed, CheckCircle2 } from "lucide-react"

type DemoState = "idle" | "playing" | "done"

function Bubble({ children, delay, show, align = "left", variant = "neutral" }: {
  children: React.ReactNode; delay: string; show: boolean; align?: "left" | "right"
  variant?: "neutral" | "red" | "cyan"
}) {
  const bg = variant === "red" ? "bg-red-500/10 text-red-400" :
    variant === "cyan" ? "bg-[#00e5ff]/10 text-[#00e5ff]" : "bg-[#1a1a1a] text-white"
  return (
    <div
      className={`rounded-2xl px-3.5 py-2 text-[13px] max-w-[85%] transition-all duration-500 ${bg} ${
        align === "right" ? "self-end rounded-br-sm" : "self-start rounded-bl-sm"
      } ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      style={{ transitionDelay: delay }}
    >
      {children}
    </div>
  )
}

export function PhoneMockup({ variant, state }: { variant: "without" | "with"; state: DemoState }) {
  const show = state === "playing" || state === "done"
  const isWithout = variant === "without"

  return (
    <div className="flex flex-col items-center">
      <div className={`text-sm font-semibold mb-3 ${isWithout ? "text-red-400" : "text-[#00e5ff]"}`}>
        {isWithout ? "❌ Without Automation" : "✅ With Automation"}
      </div>

      <div className="w-[260px] h-[460px] bg-[#111] rounded-[2.5rem] border-2 border-[#222] p-3 relative overflow-hidden shadow-2xl">
        {/* Status bar */}
        <div className="flex justify-between items-center px-4 py-1.5 text-[10px] text-[#666]">
          <span>9:41</span>
          <div className="w-16 h-4 bg-[#222] rounded-full" />
          <span>100%</span>
        </div>

        {/* Screen */}
        <div className="flex flex-col gap-2 px-2 mt-3 h-[370px] overflow-hidden">
          {isWithout ? (
            <>
              <Bubble delay="0.5s" show={show} variant="red">
                <div className="flex items-center gap-1.5">
                  <PhoneMissed className="w-3 h-3" />
                  <span>Missed Call — 9:41 AM</span>
                </div>
              </Bubble>
              <Bubble delay="2s" show={show} variant="red">
                <div className="flex items-center gap-1.5">
                  <PhoneMissed className="w-3 h-3" />
                  <span>Missed Call — 9:43 AM</span>
                </div>
              </Bubble>
              <Bubble delay="3.5s" show={show} variant="red">
                <div className="flex items-center gap-1.5">
                  <PhoneMissed className="w-3 h-3" />
                  <span>Missed Call — 9:45 AM</span>
                </div>
              </Bubble>
              <Bubble delay="5s" show={show}>
                They didn&apos;t answer. Trying someone else...
              </Bubble>
              <div className={`mt-auto text-center py-3 transition-all duration-500 ${show ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: "6.5s" }}>
                <span className="text-red-400 text-xs font-semibold bg-red-500/10 px-4 py-1.5 rounded-full">
                  Customer Lost
                </span>
              </div>
            </>
          ) : (
            <>
              <Bubble delay="0.5s" show={show} variant="red">
                <div className="flex items-center gap-1.5">
                  <PhoneMissed className="w-3 h-3" />
                  <span>Missed Call — 9:41 AM</span>
                </div>
              </Bubble>
              <Bubble delay="2s" show={show} align="right" variant="cyan">
                Hi! This is Mike&apos;s Plumbing 👋 Sorry we missed your call! We&apos;re currently on a job. Tap here to book a time:
                <span className="block mt-1 underline text-[#00e5ff]">[Book Now]</span>
              </Bubble>
              <div className={`self-end text-[10px] text-[#444] transition-all duration-300 ${show ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: "2.5s" }}>
                Response time: 8 seconds
              </div>
              <Bubble delay="4s" show={show}>
                Thanks! Booking now 👍
              </Bubble>
              <div className={`mt-auto flex items-center justify-center gap-2 py-3 transition-all duration-500 ${show ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: "5.5s" }}>
                <CheckCircle2 className="w-4 h-4 text-[#00e5ff]" />
                <span className="text-[#00e5ff] text-xs font-semibold">Customer Captured ✓</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
