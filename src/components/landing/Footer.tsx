import { Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] py-10 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#00e5ff] rounded-md flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-white font-semibold text-sm">Akshay Automation</span>
        </div>
        <p className="text-[#444] text-xs text-center">
          Brampton & Woodbridge, Ontario · Helping local businesses stop losing customers
        </p>
        <div className="flex items-center gap-4 text-xs text-[#666]">
          <a href="mailto:hello@akshayautomation.com" className="hover:text-white transition-colors">Email</a>
          <a href="https://wa.me/12898890549" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
        </div>
      </div>
    </footer>
  )
}
