"use client"
// app/(dashboard)/dashboard/agent/page.tsx
//
// AI Order Agent Chat Interface
// This is the demo-able UI where business owners can see the agent in action.
// They type a natural language order → the AI creates it → shows confirmation.

import { useState, useRef, useEffect } from "react"
import { Bot, Send, Loader2, Package, CheckCircle, AlertCircle, Sparkles } from "lucide-react"

type Message = {
  id: string
  role: "user" | "agent"
  content: string
  orderNumber?: string
  total?: number
  items?: { name: string; quantity: number; unit: string; unitPrice: number }[]
  success?: boolean
  timestamp: Date
}

const EXAMPLE_MESSAGES = [
  "I need 4 bags of Basmati Rice and 6 jugs of Canola Oil for tomorrow",
  "Order 2 bags of Red Lentils and 3 bags of Atta Flour, deliver Thursday",
  "Rush order: 10 bags of Cumin for Himalaya Grocery, need it today",
  "5 bags of rice for Punjab Palace Restaurant, next Monday",
]

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/agent/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      const agentMsg: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        content: data.message,
        orderNumber: data.orderNumber,
        total: data.total,
        items: data.items,
        success: data.success,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content: "Sorry, something went wrong. Please try again.",
          success: false,
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function useExample(text: string) {
    setInput(text)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Order Agent</h1>
            <p className="text-gray-500 text-sm">
              Type an order in plain English — the AI creates it automatically
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-6">
              Try sending an order in natural language. The AI will parse it,
              match items to inventory, and create the order.
            </p>
            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-xs text-gray-600 mb-2">Try an example:</p>
              {EXAMPLE_MESSAGES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => useExample(ex)}
                  className="block w-full text-left text-sm text-gray-400 hover:text-purple-400 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-purple-500/30 rounded-lg px-4 py-3 transition-all"
                >
                  &ldquo;{ex}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-900 border border-gray-800 text-gray-300"
              }`}
            >
              {msg.role === "agent" && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs text-purple-400 font-medium">AI Agent</span>
                  {msg.success === true && (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-1" />
                  )}
                  {msg.success === false && (
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-400 ml-1" />
                  )}
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {/* Order details card */}
              {msg.success && msg.items && (
                <div className="mt-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">
                      {msg.orderNumber}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {msg.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs text-gray-400"
                      >
                        <span>
                          {item.quantity} {item.unit} {item.name}
                        </span>
                        <span className="font-mono">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {msg.total && (
                    <div className="flex justify-between text-xs font-medium text-white mt-2 pt-2 border-t border-gray-700">
                      <span>Total (incl. HST)</span>
                      <span className="font-mono">
                        ${msg.total.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-gray-600 mt-1.5">
                {msg.timestamp.toLocaleTimeString("en-CA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing order...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type an order... e.g. '5 bags of rice for tomorrow'"
            disabled={loading}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
