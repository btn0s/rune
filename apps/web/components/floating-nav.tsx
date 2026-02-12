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
      const threshold = window.innerHeight * 0.4
      let current = links[0]?.href.slice(1) ?? ""
      for (const link of links) {
        const el = document.getElementById(link.href.slice(1))
        if (el && el.getBoundingClientRect().top <= threshold) {
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
    <nav className="fixed top-40 flex flex-col gap-3">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            "text-right text-xs transition-all duration-200",
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
