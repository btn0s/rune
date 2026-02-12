# rune

Give your AI agent full access to Figma.

rune is an open-source MCP server and Figma plugin that gives AI agents full read-write access to Figma. Create, edit, and manipulate designs — not just inspect them.

## Get started

### 1. Add to your MCP config

```json
{
  "mcpServers": {
    "rune": {
      "command": ["bunx", "@btn0s/rune@latest"]
    }
  }
}
```

Works with Claude Code, Cursor, Windsurf, and any MCP-compatible client. Requires [Bun](https://bun.sh).

### 2. Add the Figma plugin

Install the [rune Figma plugin](https://www.figma.com/community/plugin/1602795503714672621) and run it to connect.

## Development

### Prerequisites

- [Bun](https://bun.sh)
- [pnpm](https://pnpm.io) (v10+)
- [Figma desktop app](https://www.figma.com/downloads/)

### Setup

```bash
git clone https://github.com/btn0s/rune.git
cd rune && pnpm install
```

### 1. Run the plugin in dev mode

Build the plugin (or watch for changes):

```bash
pnpm --filter plugin build
# or for live reload during development:
pnpm --filter plugin dev
```

### 2. Import the plugin into Figma

1. Open the Figma desktop app
2. Go to **Plugins** > **Development** > **Import plugin from manifest...**
3. Select `apps/plugin/manifest.json` from your local clone

The plugin will now appear under **Plugins > Development > rune** in any Figma file.

### 3. Run the MCP server from source

Point your MCP client at the local server instead of the published package:

```json
{
  "mcpServers": {
    "rune": {
      "command": ["bun", "run", "/path/to/rune/apps/server/src/index.ts"]
    }
  }
}
```

### 4. Connect

1. Open a Figma file and run the dev plugin (**Plugins > Development > rune**)
2. Start your MCP client — the server and plugin will connect automatically over `ws://localhost:3055`

### HTTP mode

If you need to run the server as a standalone HTTP service (e.g., for web-based MCP clients), use the `--http` flag:

```bash
bun run apps/server/src/index.ts --http
```

Then configure your client to connect to `http://localhost:3056/mcp`.
