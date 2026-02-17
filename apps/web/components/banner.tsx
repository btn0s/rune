"use client";

import * as React from "react";
import { ArrowRight, Check, Copy } from "lucide-react";

export function Banner() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        "Set up rune so you can design in Figma. Read https://rune.design for instructions.",
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div
      className="relative overflow-hidden bg-indigo-600"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)",
      }}
    >
      <div className="flex items-center justify-center gap-3 px-6 py-3">
        <p className="text-sm font-medium text-white/90">
          Are you human? Send this to your agent{" "}
          <ArrowRight className="inline h-3.5 w-3.5" />
        </p>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/20"
        >
          {copied ? (
            <>
              Copied
              <Check className="h-3 w-3" />
            </>
          ) : (
            <>
              Copy prompt
              <Copy className="h-3 w-3" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
