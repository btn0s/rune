"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  text: string
}

export function CopyButton({ text, className, ...props }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "group inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white/70",
        className,
      )}
      {...props}
    >
      <span>{text}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" />
      )}
    </button>
  )
}
