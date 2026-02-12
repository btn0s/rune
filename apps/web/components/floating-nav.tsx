"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

const links = [
  { href: "#overview", label: "Overview" },
  { href: "#get-started", label: "Get started" },
]

export function FloatingNav() {
  const [active, setActive] = React.useState("overview")

  React.useEffect(() => {
    function onScroll() {
      let current = links[0]?.href.slice(1) ?? ""
      for (const link of links) {
        const el = document.getElementById(link.href.slice(1))
        if (el && el.getBoundingClientRect().top <= 200) {
          current = link.href.slice(1)
        }
      }
      setActive(current)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            "text-right font-mono text-xs transition-all duration-200",
            active === link.href.slice(1)
              ? "text-white/90"
              : "text-white/20 hover:text-white/50",
          )}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}
