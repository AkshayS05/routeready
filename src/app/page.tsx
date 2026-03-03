import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { StatsBar } from "@/components/landing/StatsBar"
import { LiveDemo } from "@/components/landing/LiveDemo"
import { Pricing } from "@/components/landing/Pricing"
import { WhoIsFor } from "@/components/landing/WhoIsFor"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Credibility } from "@/components/landing/Credibility"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { Footer } from "@/components/landing/Footer"

export const metadata = {
  title: "Akshay Automation | Stop Losing Customers You're Already Paying to Get",
  description:
    "AI-powered automation for local service businesses in Brampton & Woodbridge. Missed-call recovery, instant booking, automated follow-ups — set up in 7 days.",
}

export default function LandingPage() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen">
      <Navbar />
      <Hero />
      <StatsBar />
      <LiveDemo />
      <Pricing />
      <WhoIsFor />
      <HowItWorks />
      <Credibility />
      <FinalCTA />
      <Footer />
    </main>
  )
}
