export const STATS = [
  { value: 62, suffix: "%", label: "of business calls go unanswered" },
  { value: 80, suffix: "%", label: "of callers never leave a voicemail — they call your competitor" },
  { value: 255, prefix: "$", suffix: "K", label: "average annual revenue lost from missed calls alone" },
]

export const PRICING_TIERS = [
  {
    name: "Starter",
    price: 399,
    monthly: 79,
    badge: null,
    bestFor: "Salons, Barbers, Solo Trades",
    features: [
      "Missed call auto-text reply",
      "Appointment reminder (SMS, 24hrs before)",
      "Google review request after appointment",
      "Setup + testing included",
      "30 days of support",
    ],
    cta: "Get Started",
  },
  {
    name: "Growth",
    price: 699,
    monthly: 149,
    badge: "Most Popular",
    bestFor: "Contractors, Clinics, Restaurants",
    features: [
      "Everything in Starter",
      "New lead follow-up sequence (3-touch SMS+email)",
      "No-show follow-up automation",
      "Monthly customer reactivation broadcast",
      "Quote / invoice follow-up reminders",
      "Dashboard to see automation activity",
    ],
    cta: "Get Started",
  },
  {
    name: "Full System",
    price: 1199,
    monthly: 249,
    badge: null,
    bestFor: "Multi-staff businesses, high volume",
    features: [
      "Everything in Growth",
      "Full customer journey mapped and automated",
      "WhatsApp + SMS + Email all connected",
      "New booking → owner instant alert",
      "Weekly summary report",
      "Priority support, 60 days included",
    ],
    cta: "Let's Talk",
  },
]

export const BUSINESS_TYPES = [
  { emoji: "💇", label: "Salons & Spas" },
  { emoji: "✂️", label: "Barbershops" },
  { emoji: "🔧", label: "Contractors & Trades" },
  { emoji: "🧹", label: "Cleaning Services" },
  { emoji: "🏋️", label: "Fitness & Personal Trainers" },
  { emoji: "🚗", label: "Auto Shops & Detailers" },
]

export const HOW_IT_WORKS = [
  {
    step: 1,
    emoji: "🗓️",
    title: "Free 15-Min Call",
    description: "We learn your business and find exactly where you're losing customers or money.",
  },
  {
    step: 2,
    emoji: "⚙️",
    title: "We Build It In 5–7 Days",
    description: "You don't touch anything. We set up, test, and make sure it works before handing it over.",
  },
  {
    step: 3,
    emoji: "📈",
    title: "Customers Stop Falling Through The Cracks",
    description: "Automations run 24/7. You focus on the work. We handle the follow-up.",
  },
]

export const WHATSAPP_NUMBER = "12898890549"
export const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ""
