# rune

Give your AI agent full access to Figma.

rune is an open-source MCP server and Figma plugin that gives AI agents full read-write access to Figma. Create, edit, and manipulate designs — not just inspect them.

## Get started

### 1. Clone the repo

```bash
git clone https://github.com/btn0s/rune.git
cd rune && pnpm install
```

### 2. Add to your MCP config

```json
{
  "mcpServers": {
    "rune": {
      "command": ["bun", "run", "/path/to/rune/apps/server/src/index.ts"]
    }
  }
}
```

Works with Claude Code, Cursor, Windsurf, and any MCP-compatible client.

### 3. Add the Figma plugin

In Figma, go to **Plugins → Development → Import plugin from manifest** and select `apps/plugin/manifest.json` from the cloned repo. Run the plugin to connect.

### Advanced: HTTP mode

If you need to run the server as a standalone HTTP service (e.g., for web-based MCP clients), use the `--http` flag:

```bash
bun run apps/server/src/index.ts --http
```

Then configure your client to connect to `http://localhost:3056/mcp`.
