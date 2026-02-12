import type { Metadata } from "next"
import Image from "next/image"
import { Github } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { CodeBlock } from "@/components/code-block"
import { FloatingNav } from "@/components/floating-nav"
import logo from "./rune-logo.png"

const SITE_URL = "https://rune.design"

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
}

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white/80 selection:bg-white/20">
      <FloatingNav />

      <header className="fixed left-1/2 top-4 z-50 flex w-full max-w-xl -translate-x-1/2 items-center justify-between rounded-full bg-white/[0.08] px-5 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Image
            src={logo}
            alt="rune"
            width={20}
            height={20}
            className="rounded"
          />
          <span className="text-sm text-white/70">rune.design</span>
        </div>
        <a
          href="https://github.com/btn0s/rune"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/30 transition-colors hover:text-white/70"
          aria-label="rune on GitHub"
        >
          <Github className="h-4 w-4" />
        </a>
      </header>

      <main className="mx-auto max-w-xl px-6 pb-32 pt-32">
        <section id="overview" className="mb-24 scroll-mt-72">
          <div className="mb-8 flex items-center gap-4">
            <Image
              src={logo}
              alt="rune"
              width={48}
              height={48}
              className="rounded-lg"
            />
          </div>

          <h1 className="mb-6 text-3xl font-normal leading-tight tracking-tight text-white">
            Give your AI agent
            <br />
            full access to Figma.
          </h1>

          <p className="mb-8 leading-relaxed text-white/40">
            rune is an open-source MCP server and Figma plugin that gives your
            agent full read-write access to Figma. Create, edit, and manipulate
            designs — not just inspect them.
          </p>

          <CopyButton text="git clone https://github.com/btn0s/rune.git" />
        </section>

        <div className="mb-24 h-px w-full bg-white/5" aria-hidden="true" />

        <section id="get-started" className="mb-24 scroll-mt-72">
          <h2 className="mb-8 text-xs uppercase tracking-widest text-white/30">
            Get started
          </h2>

          <ol className="space-y-10 text-sm leading-relaxed">
            <li>
              <div className="mb-3 flex gap-4">
                <span className="shrink-0 text-white/20">01</span>
                <span className="text-white/70">Clone the repo</span>
              </div>
              <CodeBlock copyText="git clone https://github.com/btn0s/rune.git && cd rune && pnpm install">
                <span className="text-white/60">git clone https://github.com/btn0s/rune.git</span>{"\n"}
                <span className="text-white/60">cd rune && pnpm install</span>
              </CodeBlock>
            </li>

            <li>
              <div className="mb-3 flex gap-4">
                <span className="shrink-0 text-white/20">02</span>
                <span className="text-white/70">Start the server</span>
              </div>
              <CodeBlock copyText="pnpm server">
                <span className="text-white/60">pnpm server</span>
              </CodeBlock>
            </li>

            <li>
              <div className="mb-3 flex gap-4">
                <span className="shrink-0 text-white/20">03</span>
                <span className="text-white/70">Add to your MCP config</span>
              </div>
              <CodeBlock copyText={`{\n  "mcpServers": {\n    "rune": {\n      "url": "http://localhost:3056/mcp"\n    }\n  }\n}`}>
                <span className="text-white/20">{`{`}</span>{"\n"}
                <span className="text-white/20">{`  "mcpServers": {`}</span>{"\n"}
                <span className="text-white/20">{`    `}</span><span className="text-white/50">{`"rune"`}</span><span className="text-white/20">{`: {`}</span>{"\n"}
                <span className="text-white/20">{`      "url": `}</span><span className="text-white/60">{`"http://localhost:3056/mcp"`}</span>{"\n"}
                <span className="text-white/20">{`    }`}</span>{"\n"}
                <span className="text-white/20">{`  }`}</span>{"\n"}
                <span className="text-white/20">{`}`}</span>
              </CodeBlock>
              <p className="mt-3 text-xs text-white/30">
                Works with Claude Code, Cursor, Windsurf, and any MCP-compatible client.
              </p>
            </li>

            <li>
              <div className="mb-3 flex gap-4">
                <span className="shrink-0 text-white/20">04</span>
                <span className="text-white/70">Add the Figma plugin</span>
              </div>
              <p className="text-white/40">
                In Figma, go to{" "}
                <span className="text-white/60">Plugins → Development → Import plugin from manifest</span>
                {" "}and select{" "}
                <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-white/50">apps/plugin/manifest.json</span>
                {" "}from the cloned repo. Run the plugin to connect.
              </p>
            </li>
          </ol>
        </section>

        <footer className="border-t border-white/5 pt-8 text-xs text-white/20">
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
  )
}
