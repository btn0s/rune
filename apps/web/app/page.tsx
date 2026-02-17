import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import logo from "./rune-logo.png";

const SITE_URL = "https://rune.design";

export const metadata: Metadata = {
  title: "rune — give your AI agent full access to Figma",
  description:
    "rune is an open-source MCP server and Figma plugin that gives AI agents full read-write access to Figma. Create, edit, and manipulate designs — not just inspect them.",
  metadataBase: new URL(SITE_URL),
  keywords: [
    "rune",
    "figma",
    "mcp",
    "model context protocol",
    "ai design",
    "figma plugin",
    "figma mcp",
    "ai figma",
    "design automation",
    "figma write access",
  ],
  authors: [{ name: "btn0s", url: "https://github.com/btn0s" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "rune",
    title: "rune — give your AI agent full access to Figma",
    description:
      "Open-source MCP server that gives AI agents full read-write access to Figma. Create, edit, and manipulate designs — not just inspect them.",
  },
  twitter: {
    card: "summary_large_image",
    title: "rune — give your AI agent full access to Figma",
    description:
      "Open-source MCP server that gives AI agents full read-write access to Figma.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white/80 selection:bg-white/20">
      <div className="mx-auto flex max-w-3xl justify-center gap-8 px-6 pb-24 pt-40">
        <main className="w-full max-w-xl">
          <section id="overview" className="mb-12 scroll-mt-16">
            <div className="mb-6 flex items-center gap-2">
              <Image
                src={logo}
                alt="rune"
                width={20}
                height={20}
                className="rounded"
              />
              <span className="text-sm text-white/50">rune.design</span>
            </div>

            <h1 className="mb-4 text-3xl font-normal leading-tight tracking-tight text-white">
              Give your AI agent
              <br />
              full access to Figma.
            </h1>

            <p className="mb-6 leading-relaxed text-white/40">
              rune is an open-source MCP server and Figma plugin that gives your
              agent full read-write access to Figma. Create, edit, and
              manipulate designs — not just inspect them.
            </p>

            <div className="mb-8 flex flex-wrap gap-2">
              <Badge variant="secondary">Create frames & layouts</Badge>
              <Badge variant="secondary">Edit text & styles</Badge>
              <Badge variant="secondary">Read any node</Badge>
              <Badge variant="secondary">Export assets</Badge>
              <Badge variant="secondary">Auto-layout</Badge>
              <Badge variant="secondary">Components</Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="link" size="sm" className="px-0" asChild>
                <a
                  href="https://github.com/btn0s/rune#development"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get started
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </Button>
              <Button variant="link" size="sm" className="px-0" asChild>
                <a
                  href="https://github.com/btn0s/rune"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </section>

          <footer className="border-t border-white/5 pt-6 text-xs text-white/20">
            <div className="flex items-center justify-between">
              <span>rune v0.0.1</span>
              <a
                href="https://github.com/btn0s/rune"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white/50"
              >
                github →
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
