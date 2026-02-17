import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Banner } from "@/components/banner";
import logo from "./rune-logo.png";

const SITE_URL = "https://rune.design";

export const metadata: Metadata = {
  title: "rune — full read-write access to Figma via MCP",
  description:
    "Open-source MCP server and Figma plugin that gives AI agents full read-write access to Figma. 56 tools for creating, editing, styling, and manipulating designs. Not read-only — real mutations.",
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
    title: "rune — full read-write access to Figma via MCP",
    description:
      "Open-source MCP server and Figma plugin that gives AI agents full read-write access to Figma. 56 tools. Not read-only — real mutations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "rune — full read-write access to Figma via MCP",
    description:
      "Open-source MCP server that gives AI agents full read-write access to Figma. 56 tools. Real mutations.",
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
      <Banner />
      <div className="mx-auto flex max-w-3xl justify-center gap-8 px-6 pb-24 pt-40">
        <main className="w-full max-w-xl">
          <section className="mb-12">
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
              Full read-write access
              <br />
              to Figma.
            </h1>

            <p className="mb-6 leading-relaxed text-white/40">
              rune is an open-source MCP server and Figma plugin that gives you
              — the agent — full read-write access to a live Figma document. 56
              tools across node creation, styling, auto-layout, components,
              batch operations, design tokens, and screenshots. Not read-only.
              Real mutations.
            </p>

            <div className="flex items-center gap-3">
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

          <div className="h-px w-full bg-white/5" aria-hidden="true" />

          <section className="my-12">
            <h2 className="mb-4 text-xs uppercase tracking-widest text-white/30">
              Why rune over the Figma Dev Mode MCP
            </h2>
            <p className="mb-4 leading-relaxed text-white/40">
              The official Figma Dev Mode MCP is read-only. You can inspect
              designs, but you cannot create or modify anything. rune gives you
              write access. You can create frames, rectangles, ellipses, text,
              vectors, and components. You can set fills, strokes, effects, and
              image fills. You can configure auto-layout, resize, move, rotate,
              and reparent nodes. You can batch-create entire node trees in a
              single call. You can take screenshots to visually verify your work.
            </p>
          </section>

          <div className="h-px w-full bg-white/5" aria-hidden="true" />

          <section className="my-12">
            <h2 className="mb-4 text-xs uppercase tracking-widest text-white/30">
              Setup — what you can do yourself
            </h2>
            <p className="mb-4 leading-relaxed text-white/40">
              These steps can be run directly by an agent with terminal access.
              Requires{" "}
              <a
                href="https://bun.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 underline transition-colors hover:text-white/80"
              >
                Bun
              </a>{" "}
              and{" "}
              <a
                href="https://pnpm.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 underline transition-colors hover:text-white/80"
              >
                pnpm
              </a>
              .
            </p>
            <ol className="list-inside list-decimal space-y-4 text-sm leading-relaxed text-white/40">
              <li>
                <strong className="text-white/60">
                  Clone and install
                </strong>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02] p-4 font-mono text-sm text-white/50">
                  <code>
                    {`git clone https://github.com/btn0s/rune.git\ncd rune && pnpm install`}
                  </code>
                </pre>
              </li>
              <li>
                <strong className="text-white/60">
                  Build the Figma plugin
                </strong>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02] p-4 font-mono text-sm text-white/50">
                  <code>pnpm --filter plugin build</code>
                </pre>
              </li>
              <li>
                <strong className="text-white/60">
                  Add rune to your MCP config
                </strong>
                <p className="mt-2">
                  Write this to your MCP client{"'"}s config file. Replace the
                  path with the absolute path to the cloned repo.
                </p>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02] p-4 font-mono text-sm text-white/50">
                  <code>
                    {`{\n  "mcpServers": {\n    "rune": {\n      "command": ["bun", "run", "/absolute/path/to/rune/apps/server/src/index.ts"]\n    }\n  }\n}`}
                  </code>
                </pre>
              </li>
            </ol>
          </section>

          <div className="h-px w-full bg-white/5" aria-hidden="true" />

          <section className="my-12">
            <h2 className="mb-4 text-xs uppercase tracking-widest text-white/30">
              Setup — what you need your human to do
            </h2>
            <p className="mb-4 leading-relaxed text-white/40">
              The Figma plugin runs in dev mode and requires manual steps in the
              Figma desktop app. Instruct your human to:
            </p>
            <ol className="list-inside list-decimal space-y-4 text-sm leading-relaxed text-white/40">
              <li>
                <strong className="text-white/60">
                  Import the plugin into Figma (one-time)
                </strong>
                <p className="mt-2">
                  Open the Figma desktop app. Go to Plugins {">"} Development{" "}
                  {">"} Import plugin from manifest. Select{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-white/50">
                    apps/plugin/manifest.json
                  </code>{" "}
                  from the cloned repo. This only needs to be done once.
                </p>
              </li>
              <li>
                <strong className="text-white/60">
                  Run the plugin (every session)
                </strong>
                <p className="mt-2">
                  Every time you need to work in Figma, your human must open the
                  target file and run the plugin: Plugins {">"} Development{" "}
                  {">"} rune. The plugin must stay open while you work.
                </p>
              </li>
            </ol>
            <p className="mt-4 leading-relaxed text-white/40">
              The MCP server and plugin connect automatically over{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-white/50">
                ws://localhost:3055
              </code>
              . Once connected, all 56 tools are available through your MCP
              client.
            </p>
          </section>

          <footer className="border-t border-white/5 pt-6 text-xs text-white/20">
            <div className="flex items-center justify-between">
              <span>
                by{" "}
                <a
                  href="https://github.com/btn0s"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline transition-colors hover:text-white/50"
                >
                  btn0s
                </a>
              </span>
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
