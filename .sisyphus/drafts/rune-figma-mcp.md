# Draft: Rune — Figma MCP Server Plugin

## Core Concept
A Figma plugin ("Rune") that stays open as a minimal headless window, running an MCP bridge so any AI chat client (Claude, Cursor, OpenCode, etc.) can drive Figma through tools.

## Architecture Decision (confirmed)
- **Pattern**: Plugin (Figma sandbox) ↔ WebSocket ↔ Local MCP Server (Node/Bun process)
- **Why not MCP in browser iframe?**: Figma plugin UI runs in a sandboxed iframe. MCP SDK expects Node.js. The proven pattern (Talk-to-Figma, 5.8k stars) uses a 3-piece architecture:
  1. **MCP Server** (Node/Bun process) — defines tools, speaks MCP over stdio to AI clients
  2. **WebSocket Relay** (local Bun/Node process) — bridges MCP server ↔ Figma plugin
  3. **Figma Plugin** (iframe UI + main thread) — receives commands via WS, executes via Figma Plugin API
- **Communication flow**: AI Client → MCP (stdio) → MCP Server → WebSocket → Plugin UI → postMessage → Plugin Main Thread (has figma global) → executes → response back

## What Exists (current repo)
- Standard Figma plugin scaffold (manifest.json, code.ts, ui.html)
- Plugin ID already registered: 1602795503714672621
- TypeScript setup with @figma/plugin-typings
- Basic rectangle creation example working
- `networkAccess.allowedDomains`: currently "none" — NEEDS to be updated for WebSocket

## Research Findings

### Talk-to-Figma Reference (5.8k stars, sonnylazuardi/grab)
- Proven 3-piece architecture: MCP server + WebSocket relay + Figma plugin
- Uses Bun as runtime
- ~40+ tools covering: document info, selection, create shapes, text, frames, auto-layout, fills, strokes, corner radius, components, annotations, export, resize, move, delete, clone
- Channel-based WebSocket for multi-instance support
- Uses `@modelcontextprotocol/sdk` with stdio transport
- MCP server sends commands → WS → plugin, waits for response via pendingRequests map with UUIDs
- Plugin main thread handles commands via figma.ui.onmessage

### MCP SDK (TypeScript)
- `@modelcontextprotocol/server` — McpServer class
- Tools defined with Zod schemas for inputs
- Transport options: stdio (most common for CLI tools), Streamable HTTP, SSE
- For AI client integration (Claude, Cursor): stdio is standard
- Tool format: `server.tool(name, description, inputSchema, handler)`

### Figma Plugin API Key Facts
- **Two threads**: Main thread (figma global, no network) ← postMessage → UI thread (iframe, has network)
- **Node creation**: figma.createFrame(), createRectangle(), createText(), createEllipse(), createLine(), createComponent(), etc.
- **Auto-layout**: layoutMode, primaryAxisAlignItems, counterAxisAlignItems, padding, itemSpacing, layoutSizingHorizontal/Vertical
- **Text**: Must load fonts with figma.loadFontAsync() before setting text
- **Navigation**: figma.currentPage, figma.root.children (pages), figma.getNodeById(), figma.viewport
- **Selection**: figma.currentPage.selection
- **Styles**: fills, strokes, effects, cornerRadius, opacity, blendMode
- **Export**: node.exportAsync() for PNG/JPG/SVG/PDF

## Decisions Made
- Architecture: 3-piece (MCP Server + WS Relay + Plugin) ✅
- Runtime: Bun (proven with Talk-to-Figma) 
- MCP transport: stdio (standard for AI clients)
- Plugin should NOT close after running — stays open as persistent bridge

## Decisions Made (from interview)
1. **Build fresh** — reference Talk-to-Figma patterns but own the code, design better tool architecture
2. **Full comprehensive toolset** — ~60-80 tools covering all Figma API surfaces
3. **Combined server** — MCP + WebSocket in one Bun process (simpler DX)
4. **Figma first, FigJam later** — focus tools on Figma design, FigJam can come as extension

## Key Pitfalls to Avoid (from research)
- Must use `wss://` (TLS) — Figma iframe requires it for WebSocket
- Need self-signed cert for localhost dev
- Plugin UI can reload unexpectedly → need auto-reconnect with backoff
- Large node trees can crash plugin → need chunking for read operations
- `figma.loadFontAsync()` required before ANY text manipulation
- postMessage is fire-and-forget → need request/response correlation with UUIDs + timeouts
- Serialize everything with JSON.parse(JSON.stringify()) before postMessage
- `manifest.json` networkAccess.allowedDomains must include WS server domain

## Unsolved Gaps (from research — no one has solved these yet)
- AI changes don't integrate with Figma's undo/redo history
- No multi-user AI editing (race conditions)
- No bidirectional sync (Figma changes → AI awareness in real-time)
- No deep design system / design tokens awareness via MCP

## Additional Decisions
- **Bun for everything** — runtime, bundler, package manager
- **ws://localhost first** — try plain WebSocket, add TLS only if Figma blocks it
- **Single connection** — one Figma file at a time, no channel routing
- **No tests** — manual QA only, integration-heavy project

## Scope Boundaries
- INCLUDE: MCP server with comprehensive Figma tools, WS bridge, Figma plugin, build system
- EXCLUDE: AI/LLM integration, chat UI, AISDK usage, FigJam tools (all later phases)
