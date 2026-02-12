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

### Development

```bash
git clone https://github.com/btn0s/rune.git
cd rune && pnpm install
```

Run the server locally from source:

```json
{
  "mcpServers": {
    "rune": {
      "command": ["bun", "run", "/path/to/rune/apps/server/src/index.ts"]
    }
  }
}
```

### Advanced: HTTP mode

If you need to run the server as a standalone HTTP service (e.g., for web-based MCP clients), use the `--http` flag:

```bash
bun run apps/server/src/index.ts --http
```

Then configure your client to connect to `http://localhost:3056/mcp`.
