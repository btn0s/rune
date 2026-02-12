"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

export function CodeBlock({ children, copyText }: { children: React.ReactNode; copyText: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  return (
    <div className="group relative rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm leading-relaxed">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 text-white/20 transition-colors hover:text-white/50"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <pre className="overflow-x-auto font-mono">{children}</pre>
    </div>
  )
}
