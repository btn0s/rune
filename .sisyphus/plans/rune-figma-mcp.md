# Rune — Figma MCP Server Plugin

## TL;DR

> **Quick Summary**: Build an MCP server that lets any AI client (Claude, Cursor, OpenCode) drive Figma design through ~42 focused tools. The system has two pieces: a local Bun process (MCP server + WebSocket bridge) and a minimal Figma plugin that stays open and forwards commands to the Figma API. Toolset is trimmed for AI performance — fewer tools means less token overhead per message, with consolidated "power tools" replacing many single-purpose ones.
> 
> **Deliverables**:
> - Bun-based MCP server with WebSocket bridge (single process)
> - Figma plugin with minimal UI acting as a command bridge
> - ~42 MCP tools across 8 categories, optimized for AI token efficiency
> - Build system, dev workflow, and MCP client configuration
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 (project setup) → Task 2 (bridge infrastructure) → Tasks 3-9 (tools, parallel) → Task 10 (integration)

---

## Context

### Original Request
Build a Figma plugin ("Rune") that exposes an MCP server with a comprehensive set of tools for writing, navigating, and editing Figma files. The plugin stays open as a minimal headless window, running a WebSocket bridge so any AI chat client can connect and manipulate Figma through MCP tools.

### Interview Summary
**Key Discussions**:
- Architecture: Combined MCP + WS in one Bun process (not separate like Talk-to-Figma)
- Build fresh from scratch, use Talk-to-Figma (5.8k stars) as pattern reference only
- Trimmed, focused toolset (~42 tools) — cut niche tools, merged redundancies, consolidated styling into power tools for better AI token efficiency
- Figma design editor focus first, FigJam later
- No unit tests — manual QA only

**Research Findings**:
- Talk-to-Figma proves the 3-piece architecture works (MCP ↔ WS ↔ Plugin)
- MCP SDK uses `server.registerTool()` (v2) with Zod schemas; stdio transport for AI clients
- Figma plugin has two threads: Main (figma API, no network) ↔ UI (iframe, has network, WebSocket)
- `ws://localhost` likely works (browser localhost exemption for mixed content) — no TLS needed initially
- Key pitfalls: font loading before text ops, JSON serialization for postMessage, plugin terminates on file switch, large data needs chunking
- Nobody has solved undo/redo integration or bidirectional sync — out of scope

### Metis Review
**Identified Gaps** (addressed):
- Plugin termination on file switch → added graceful disconnect handling, pending request timeouts
- `figma.clientStorage` for persisting connection settings → included in plugin design
- MCP SDK v2 `registerTool` vs v1 `tool` → using v2 syntax exclusively
- `Uint8Array` from export → postMessage supports it, but must base64-encode for WS JSON
- `manifest.json` networkAccess needs port number and reasoning field → included

---

## Work Objectives

### Core Objective
Create a production-quality MCP server that gives AI clients full read/write access to Figma's design capabilities through a locally-running Bun process and a persistent Figma plugin bridge.

### Concrete Deliverables
- `src/server/` — MCP server + WebSocket bridge (Bun process)
- `src/plugin/code.ts` — Figma plugin main thread (command executor)
- `src/plugin/ui.html` — Figma plugin UI thread (WebSocket client + minimal status UI)
- `src/shared/` — Shared types, message protocol, tool definitions
- `manifest.json` — Updated Figma plugin manifest
- `package.json` — Bun project configuration with scripts
- `tsconfig.json` — TypeScript configuration for both plugin and server
- `README.md` — Setup and usage instructions (MCP client config examples)

### Definition of Done
- [x] `bun run server` starts MCP server + WS bridge on localhost
- [x] Plugin connects to WS bridge when opened in Figma
- [x] All ~42 tools are registered and callable through any MCP client
- [x] AI client can create frames, text, shapes, set styles, manage auto-layout, and navigate the document
- [x] Connection survives plugin UI reloads with auto-reconnect
- [x] Plugin gracefully handles file switch (termination + reconnect)

### Must Have
- All tool categories: Document/Navigation, Selection, Node Creation, Styling, Layout, Text, Components, Export, Viewport, Node Manipulation
- Request/response correlation with UUIDs and configurable timeouts
- Auto-reconnect in plugin UI with exponential backoff
- Font loading before any text operations
- Chunked responses for large node tree reads
- Error handling that returns meaningful messages to the AI client

### Must NOT Have (Guardrails)
- **No AI/LLM integration** — this is purely MCP tools, no AISDK, no Gemini, no chat
- **No chat UI** — the plugin UI is minimal (connection status only)
- **No FigJam/Slides/Buzz tools** — Figma design editor only for now
- **No REST API access** — all operations go through the Plugin API (local, real-time)
- **No undo/redo integration** — known unsolved problem, explicitly out of scope
- **No bidirectional sync** — plugin doesn't push Figma changes to AI proactively
- **No authentication/auth flows** — local development tool, no auth needed
- **No remote hosting** — runs on localhost only
- **No TLS/SSL** — start with `ws://localhost`, add TLS only if Figma CSP blocks it
- **No over-abstraction** — tool handlers should be direct and readable, not abstracted behind layers of indirection
- **No variables/design tokens tools in v1** — complex subsystem, add in a follow-up

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NONE
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **MCP Server startup** | Bash | `bun run server` starts without errors, logs "listening" |
| **Plugin build** | Bash | `bun run build:plugin` produces code.js and ui.html without errors |
| **MCP tool registration** | Bash | Connect via MCP inspector or test client, verify tools/list returns all tools |
| **WebSocket bridge** | Bash | `websocat ws://localhost:3055` connects successfully |
| **Plugin in Figma** | Playwright (Figma desktop is Electron) | Open plugin, verify connection status shows "Connected" |
| **End-to-end tool execution** | Bash | Send MCP tool call → verify Figma canvas changed via read tools |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Project setup, build system, shared types

Wave 2 (After Wave 1):
├── Task 2: WebSocket bridge + MCP server infrastructure
└── Task 3: Figma plugin bridge (UI + main thread)

Wave 3 (After Wave 2):
├── Task 4: Document & Navigation tools
├── Task 5: Node Creation tools
├── Task 6: Styling tools
├── Task 7: Layout & Auto-layout tools
├── Task 8: Text tools
└── Task 9: Node Manipulation, Export, Components tools

Wave 4 (After Wave 3):
└── Task 10: Integration, polish, README, MCP client config
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None |
| 2 | 1 | 4-9 | 3 |
| 3 | 1 | 4-9 | 2 |
| 4 | 2, 3 | 10 | 5, 6, 7, 8, 9 |
| 5 | 2, 3 | 10 | 4, 6, 7, 8, 9 |
| 6 | 2, 3 | 10 | 4, 5, 7, 8, 9 |
| 7 | 2, 3 | 10 | 4, 5, 6, 8, 9 |
| 8 | 2, 3 | 10 | 4, 5, 6, 7, 9 |
| 9 | 2, 3 | 10 | 4, 5, 6, 7, 8 |
| 10 | 4-9 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Category |
|------|-------|---------------------|
| 1 | 1 | quick |
| 2 | 2, 3 | unspecified-high (parallel) |
| 3 | 4, 5, 6, 7, 8, 9 | unspecified-high (parallel) |
| 4 | 10 | unspecified-high |

---

## TODOs

- [x] 1. Project Setup & Build System

  **What to do**:
  - Initialize Bun project: `bun init`, set up package.json with scripts
  - Install dependencies: `@modelcontextprotocol/sdk`, `zod`, `@figma/plugin-typings`
  - Create directory structure:
    ```
    src/
      server/        — MCP server + WS bridge
      plugin/        — Figma plugin (code.ts, ui.html)
      shared/        — Shared types and protocol
    ```
  - Create `src/shared/protocol.ts` — define the message protocol between server and plugin:
    - `CommandMessage`: `{ id: string, type: string, params: Record<string, any> }`
    - `ResponseMessage`: `{ id: string, result?: any, error?: string }`
    - `StatusMessage`: `{ type: 'connected' | 'disconnected' | 'error', message: string }`
    - All tool names as a union type
  - Create `src/shared/types.ts` — shared Figma-related types (color, bounds, node info, etc.)
  - Set up `tsconfig.json` with paths for shared code compilation
  - Update `manifest.json`:
    - `networkAccess.allowedDomains`: `["localhost"]`
    - `documentAccess`: `"dynamic-page"`
    - `editorType`: `["figma"]` (remove figjam/slides/buzz)
    - `ui`: point to built ui.html
    - `main`: point to built code.js
  - Add build scripts to package.json:
    - `bun run build:plugin` — bundles plugin code.ts → code.js and ui.html
    - `bun run build:server` — bundles server (if needed, Bun can run .ts directly)
    - `bun run server` — starts the MCP server + WS bridge
    - `bun run dev` — watches and rebuilds plugin on changes

  **Must NOT do**:
  - Do not install any AI/LLM libraries
  - Do not set up test infrastructure
  - Do not create complex monorepo tooling — keep it simple

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Boilerplate setup, file creation, dependency installation
  - **Skills**: []
    - No specialized skills needed for project scaffolding

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (alone)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `manifest.json` (current) — existing plugin manifest to update (keep plugin ID `1602795503714672621`)
  - `package.json` (current) — existing package.json to rebuild with Bun
  - `tsconfig.json` (current) — existing tsconfig to extend

  **External References**:
  - Talk-to-Figma `package.json`: https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp/blob/main/package.json — reference for dependency list and scripts
  - MCP SDK npm: `@modelcontextprotocol/sdk` — server and Zod for tool schemas
  - Figma plugin typings: `@figma/plugin-typings` — types for the figma global API

  **Acceptance Criteria**:
  - [ ] `bun install` succeeds with all dependencies
  - [ ] Directory structure exists: `src/server/`, `src/plugin/`, `src/shared/`
  - [ ] `src/shared/protocol.ts` defines CommandMessage, ResponseMessage, StatusMessage types
  - [ ] `src/shared/types.ts` defines RGBA, Bounds, NodeInfo types
  - [ ] `manifest.json` has correct networkAccess, editorType, and file paths
  - [ ] `bun run build:plugin` produces `dist/code.js` and `dist/ui.html` (or equivalent output)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Build system produces valid plugin artifacts
    Tool: Bash
    Preconditions: Dependencies installed
    Steps:
      1. Run: bun run build:plugin
      2. Assert: exit code 0
      3. Assert: output file for code.js exists and is non-empty
      4. Assert: output file for ui.html exists and is non-empty
      5. Run: bun run build:plugin 2>&1 | grep -i error
      6. Assert: no error output
    Expected Result: Plugin builds cleanly
    Evidence: Build output captured

  Scenario: Shared types compile without errors
    Tool: Bash
    Preconditions: TypeScript configured
    Steps:
      1. Run: bunx tsc --noEmit src/shared/protocol.ts src/shared/types.ts
      2. Assert: exit code 0
    Expected Result: Type definitions are valid TypeScript
    Evidence: Compiler output captured
  ```

  **Commit**: YES
  - Message: `feat(setup): initialize rune project with bun, shared types, and build system`
  - Files: `package.json, tsconfig.json, manifest.json, src/shared/protocol.ts, src/shared/types.ts, bun scripts`

---

- [x] 2. MCP Server + WebSocket Bridge Infrastructure

  **What to do**:
  - Create `src/server/index.ts` — entry point that starts both MCP server and WebSocket bridge
  - Create `src/server/mcp.ts` — McpServer setup:
    - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
    - Import `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
    - Create server with name "rune" and version from package.json
    - Connect to stdio transport
    - Export a `registerTool` helper that wraps `server.registerTool()` with standard error handling
  - Create `src/server/bridge.ts` — WebSocket bridge:
    - Use `Bun.serve()` with WebSocket upgrade handling (no external ws library needed)
    - Listen on configurable port (default 3055)
    - Track single plugin connection (store the WebSocket reference)
    - Implement `sendCommand(type: string, params: object): Promise<any>`:
      - Generate UUID for request
      - Send JSON message to plugin WebSocket
      - Store in `pendingRequests` map with resolve/reject/timeout
      - Return promise that resolves when plugin responds
      - Configurable timeout (default 30s, longer for exports)
    - Handle plugin disconnect: reject all pending requests, log status
    - Handle plugin reconnect: accept new connection, update reference
    - Log all connections/disconnections to stderr (not stdout — stdio is for MCP)
  - Create `src/server/logger.ts` — logger that writes to stderr only (stdout is MCP stdio transport)
  - Wire up: index.ts creates MCP server, creates WS bridge, passes bridge to tool registration modules

  **Must NOT do**:
  - Do not implement any tools yet — just the infrastructure
  - Do not use external WebSocket library — Bun has native WebSocket support
  - Do not implement channel routing — single connection only
  - Do not write to stdout for logging (breaks MCP stdio transport)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core infrastructure with careful async patterns and error handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Tasks 4, 5, 6, 7, 8, 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - Talk-to-Figma `server.ts` — https://raw.githubusercontent.com/sonnylazuardi/cursor-talk-to-figma-mcp/main/src/talk_to_figma_mcp/server.ts — reference for MCP server setup, pendingRequests pattern, sendCommandToFigma pattern, logger pattern (stderr only)
  - Talk-to-Figma `socket.ts` — https://raw.githubusercontent.com/sonnylazuardi/cursor-talk-to-figma-mcp/main/src/socket.ts — reference for Bun.serve() WebSocket setup

  **API/Type References**:
  - `src/shared/protocol.ts` (from Task 1) — CommandMessage, ResponseMessage types for WS messages
  - `src/shared/types.ts` (from Task 1) — shared type definitions

  **External References**:
  - MCP SDK server docs: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md — `McpServer`, `registerTool()`, `StdioServerTransport`
  - Bun WebSocket docs: https://bun.sh/docs/api/websockets — `Bun.serve()` with websocket handler

  **WHY Each Reference Matters**:
  - Talk-to-Figma server.ts: Shows the exact `pendingRequests` Map pattern with UUID correlation, timeout handling, and stderr-only logging that avoids corrupting MCP stdio
  - Talk-to-Figma socket.ts: Shows Bun.serve() WebSocket setup with message routing — we simplify by removing channel logic
  - MCP SDK docs: Correct v2 syntax for `registerTool()` with Zod schemas

  **Acceptance Criteria**:
  - [ ] `bun run server` starts without errors and logs "MCP server started" and "WebSocket bridge listening on ws://localhost:3055" to stderr
  - [ ] WebSocket accepts connections from a test client
  - [ ] `sendCommand()` sends a message and resolves when response received
  - [ ] `sendCommand()` rejects with timeout error after 30s if no response
  - [ ] Plugin disconnect rejects all pending requests
  - [ ] MCP `tools/list` returns empty list (no tools registered yet)
  - [ ] No output to stdout except MCP JSON-RPC messages

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: MCP server starts and WS bridge listens
    Tool: Bash
    Preconditions: Project built
    Steps:
      1. Run: bun run server &
      2. Wait 2s for startup
      3. Assert: stderr contains "WebSocket bridge listening"
      4. Run: echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | timeout 5 bun run server
      5. Assert: stdout contains "protocolVersion" in JSON response
      6. Kill background process
    Expected Result: Server starts and responds to MCP initialize
    Evidence: stdout/stderr output captured

  Scenario: WebSocket bridge accepts and tracks connection
    Tool: Bash
    Preconditions: Server running on port 3055
    Steps:
      1. Start server in background
      2. Run: echo '{"type":"ping"}' | websocat ws://localhost:3055
      3. Assert: connection established (no error)
      4. Kill server
    Expected Result: WebSocket accepts connection
    Evidence: Connection output captured

  Scenario: sendCommand times out when no plugin connected
    Tool: Bash
    Preconditions: Server running, no plugin connected
    Steps:
      1. Start server
      2. Send MCP tool call for any registered tool
      3. Assert: returns error about no plugin connected (not timeout)
    Expected Result: Immediate error when plugin not connected
    Evidence: Error response captured
  ```

  **Commit**: YES
  - Message: `feat(server): add MCP server infrastructure with WebSocket bridge`
  - Files: `src/server/index.ts, src/server/mcp.ts, src/server/bridge.ts, src/server/logger.ts`

---

- [x] 3. Figma Plugin Bridge (UI Thread + Main Thread)

  **What to do**:
  - Create `src/plugin/ui.html` — Plugin UI thread:
    - Minimal HTML: connection status indicator (green dot = connected, red = disconnected)
    - Display current server URL and connection state
    - WebSocket client that connects to `ws://localhost:3055`:
      - Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
      - On message from server: forward command to main thread via `parent.postMessage({ pluginMessage: msg }, '*')`
      - On message from main thread: forward response to server via `ws.send(JSON.stringify(msg))`
      - On connect: send `{ type: 'plugin_connected' }` to server
      - On disconnect: update UI status, start reconnect timer
    - Use `figma.clientStorage` via postMessage to persist last server URL (request to main thread, main thread calls `figma.clientStorage.setAsync`)
  - Create `src/plugin/code.ts` — Plugin main thread:
    - `figma.showUI(__html__, { width: 300, height: 120, themeColors: true })` — small persistent window
    - Set up `figma.ui.onmessage` handler that dispatches commands:
      - Receive `{ id, type, params }` from UI thread
      - Look up handler in a command registry (Map<string, handler>)
      - Execute handler, which uses figma API
      - Send result back: `figma.ui.postMessage({ id, result })` or `figma.ui.postMessage({ id, error })`
    - Create `src/plugin/commands/` directory for command handlers (populated in Tasks 4-9)
    - Create `src/plugin/commands/index.ts` — command registry that maps command names to handler functions
    - Implement `figma.on('close', ...)` to clean up (send disconnect to UI)
    - Handle errors gracefully: wrap all command execution in try/catch, always send response
    - NEVER call `figma.closePlugin()` — the plugin must stay running

  **Must NOT do**:
  - Do not implement any command handlers yet — just the dispatch infrastructure
  - Do not make the UI complicated — connection status only
  - Do not call `figma.closePlugin()` — the plugin is a persistent bridge
  - Do not add a "close" or "cancel" button
  - Do not validate command types yet — dispatch to registry, let it handle unknowns

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Tricky cross-context communication with postMessage, async patterns, reconnection logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Tasks 4, 5, 6, 7, 8, 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `code.ts` (current) — existing plugin main thread code showing `figma.showUI`, `figma.ui.onmessage`, `figma.currentPage.appendChild` patterns
  - `ui.html` (current) — existing plugin UI showing `parent.postMessage` pattern
  - Talk-to-Figma plugin: https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp/tree/main/src/cursor_mcp_plugin — reference for WS client in UI, command dispatch in main thread, reconnection patterns

  **API/Type References**:
  - `src/shared/protocol.ts` (from Task 1) — CommandMessage, ResponseMessage types
  - Figma Plugin API: `figma.showUI()`, `figma.ui.onmessage`, `figma.ui.postMessage()`, `figma.clientStorage`, `figma.on('close')`

  **External References**:
  - Figma plugin how-plugins-run: https://www.figma.com/plugin-docs/how-plugins-run — main thread vs UI thread communication model
  - Figma clientStorage API: https://www.figma.com/plugin-docs/api/figma/#clientstorage — for persisting settings

  **WHY Each Reference Matters**:
  - Current code.ts: Shows the exact `figma.showUI(__html__)` and `figma.ui.onmessage` patterns this code will extend
  - Talk-to-Figma plugin: Shows WebSocket client in UI iframe, auto-reconnect implementation, and command dispatch in main thread
  - Figma plugin docs: Authoritative source for the postMessage communication model constraints

  **Acceptance Criteria**:
  - [ ] `bun run build:plugin` produces code.js and ui.html
  - [ ] Plugin opens in Figma showing connection status UI
  - [ ] Plugin UI connects to ws://localhost:3055 when server is running
  - [ ] Status shows green "Connected" when WebSocket is open
  - [ ] Status shows red "Disconnected" when WebSocket is closed
  - [ ] Plugin auto-reconnects after server restart (exponential backoff)
  - [ ] Command dispatch: sending `{ id: "test", type: "unknown_cmd", params: {} }` via WS returns `{ id: "test", error: "Unknown command: unknown_cmd" }`
  - [ ] Plugin does NOT close after any operation (stays running)
  - [ ] `figma.on('close')` handler sends cleanup message

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Plugin builds and loads in Figma
    Tool: Bash
    Preconditions: Dependencies installed
    Steps:
      1. Run: bun run build:plugin
      2. Assert: exit code 0
      3. Assert: output code.js exists
      4. Assert: output ui.html exists
      5. Assert: ui.html contains "ws://localhost" (WebSocket URL)
      6. Assert: code.js contains "figma.showUI" (UI initialization)
      7. Assert: code.js does NOT contain "figma.closePlugin" (must stay running)
    Expected Result: Plugin artifacts are valid
    Evidence: Build output and file contents captured

  Scenario: Plugin UI reconnects after server restart
    Tool: Bash
    Preconditions: Plugin built, server running
    Steps:
      1. Start server
      2. Open WebSocket test client to verify server works
      3. Kill server
      4. Wait 2s
      5. Restart server
      6. Wait 5s (allow reconnect)
      7. Assert: new connection received by server
    Expected Result: Client reconnects automatically
    Evidence: Server connection logs captured
  ```

  **Commit**: YES
  - Message: `feat(plugin): add Figma plugin bridge with WebSocket client and command dispatch`
  - Files: `src/plugin/code.ts, src/plugin/ui.html, src/plugin/commands/index.ts`

---

- [x] 4. Document & Navigation Tools

  **What to do**:
  - Create `src/server/tools/document.ts` — register document/navigation tools with MCP server
  - Create `src/plugin/commands/document.ts` — implement command handlers in plugin main thread
  - Tools to implement (12 tools):

    **Document Info:**
    - `get_document_info` — returns document name, pages list (name + id), current page (replaces separate get_page_list)

    **Page Navigation:**
    - `set_current_page` — switch to a page by name or ID (`figma.setCurrentPageAsync()`)
    - `create_page` — create a new page with a given name

    **Node Navigation:**
    - `get_node_by_id` — get detailed info about a node (type, name, bounds, parent, children names/ids)
    - `get_node_children` — get children of a node (id, name, type, bounds) — paginated with offset/limit for large trees
    - `find_nodes` — search for nodes by name (exact or contains) AND/OR by type. Combines find_nodes_by_name + find_nodes_by_type into one tool with optional `name` and `type` filters

    **Selection:**
    - `get_selection` — returns currently selected nodes (id, name, type, bounds)
    - `set_selection` — select nodes by IDs

    **Viewport:**
    - `get_viewport` — returns current viewport center and zoom level
    - `set_viewport` — set viewport center and zoom
    - `zoom_to_fit` — zoom to fit specific nodes OR current selection (`figma.viewport.scrollAndZoomIntoView()`) — combines zoom_to_fit + zoom_to_selection via optional nodeIds param

  - For each tool: register in MCP server (Zod schema) + implement handler in plugin commands
  - Node info should be filtered (like Talk-to-Figma's `filterFigmaNode`) to avoid sending huge data — strip vector paths, image data, boundVariables

  **Must NOT do**:
  - Do not return full recursive tree for get_node_children — paginate
  - Do not include raw vector path data in node info
  - Do not include imageRef/image data in node info responses

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Significant number of tools, needs careful Figma API usage and data filtering
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 5, 6, 7, 8, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - Talk-to-Figma server.ts `get_document_info`, `get_selection`, `get_node_info`, `get_nodes_info` tools — https://raw.githubusercontent.com/sonnylazuardi/cursor-talk-to-figma-mcp/main/src/talk_to_figma_mcp/server.ts — MCP tool registration pattern and `filterFigmaNode()` function for stripping unnecessary data
  - `src/server/mcp.ts` (from Task 2) — registerTool helper
  - `src/plugin/commands/index.ts` (from Task 3) — command registry pattern

  **API/Type References**:
  - Figma Plugin API: `figma.root` (DocumentNode), `figma.root.children` (pages), `figma.currentPage`, `figma.setCurrentPageAsync()`, `figma.getNodeById()`, `figma.currentPage.selection`, `figma.viewport`
  - `figma.currentPage.findAll()`, `figma.currentPage.findAllWithCriteria()` — for search tools

  **Acceptance Criteria**:
  - [ ] 12 tools registered: get_document_info, set_current_page, create_page, get_node_by_id, get_node_children, find_nodes, get_selection, set_selection, get_viewport, set_viewport, zoom_to_fit
  - [ ] MCP `tools/list` includes all 12 tools with descriptions and schemas
  - [ ] `get_node_children` supports offset/limit parameters and returns paginated results
  - [ ] `find_nodes` supports both name and type filters (individually or combined)
  - [ ] `zoom_to_fit` works with nodeIds param AND without (uses selection)
  - [ ] Node info is filtered (no vector paths, no imageRef, no boundVariables)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Document tools return valid data through MCP
    Tool: Bash
    Preconditions: Server running, plugin connected in Figma with an open file
    Steps:
      1. Send MCP tools/call for "get_document_info"
      2. Assert: response contains "name" (document name)
      3. Assert: response contains "pages" array with at least 1 page
      4. Send MCP tools/call for "get_current_page"
      5. Assert: response contains "name" and "id"
    Expected Result: Document navigation tools return structured data
    Evidence: MCP response bodies captured

  Scenario: find_nodes_by_name returns filtered results
    Tool: Bash
    Preconditions: Figma file open with known node names
    Steps:
      1. Send MCP tools/call for "find_nodes_by_name" with query "Frame"
      2. Assert: response is array
      3. Assert: each result has id, name, type fields
      4. Assert: no result contains "vectorPaths" or "imageRef"
    Expected Result: Search returns clean filtered results
    Evidence: Response body captured
  ```

  **Commit**: YES
  - Message: `feat(tools): add document, navigation, selection, and viewport tools`
  - Files: `src/server/tools/document.ts, src/plugin/commands/document.ts`

---

- [x] 5. Node Creation Tools

  **What to do**:
  - Create `src/server/tools/create.ts` — register creation tools with MCP server
  - Create `src/plugin/commands/create.ts` — implement creation command handlers
  - Tools to implement (8 tools — cut polygon, star, section, component_set, boolean_operation):

    **Shapes:**
    - `create_rectangle` — x, y, width, height, name?, parentId?, fillColor?, cornerRadius?
    - `create_ellipse` — x, y, width, height, name?, parentId?, fillColor?
    - `create_line` — startX, startY, endX, endY, name?, parentId?, strokeColor?, strokeWeight?

    **Containers:**
    - `create_frame` — x, y, width, height, name?, parentId?, fillColor?, layoutMode?, padding?, itemSpacing?, primaryAxisAlignItems?, counterAxisAlignItems?, layoutSizingHorizontal?, layoutSizingVertical?
    - `create_group` — nodeIds (array of existing node IDs to group), name?
    - `create_component` — x, y, width, height, name? (creates a new component)

    **Instances:**
    - `create_instance` — componentKey, x, y, name?, parentId?

    **Text (created here, detailed in Task 8):**
    - `create_text` — x, y, text, fontSize?, fontFamily?, fontWeight?, fontColor?, textAlignHorizontal?, name?, parentId?

  - All creation tools must:
    - Return `{ id, name, type }` of the created node
    - Support optional `parentId` to append to a specific parent (default: current page)
    - Apply optional fill/stroke colors at creation time
    - Use descriptive default names based on type (e.g., "Frame", "Rectangle")

  **Must NOT do**:
  - Do not implement polygon, star, section, component_set, or boolean_operation (cut for v1 — niche)
  - Do not implement component variant creation (complex, follow-up)
  - Do not implement image node creation (requires image data handling, follow-up)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 8 tools with varied Figma API calls, careful parameter handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 6, 7, 8, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - Talk-to-Figma `create_rectangle`, `create_frame`, `create_text` tools — server.ts — shows parameter patterns and how to return created node info
  - `code.ts` (current) — shows `figma.createRectangle()`, `figma.currentPage.appendChild()`, fill color setting pattern

  **API/Type References**:
  - Figma Plugin API creation methods: `figma.createRectangle()`, `figma.createEllipse()`, `figma.createLine()`, `figma.createPolygon()`, `figma.createStar()`, `figma.createFrame()`, `figma.group()`, `figma.createSection()`, `figma.createComponent()`, `figma.createComponentSet()`, `figma.createBooleanOperation()`
  - `figma.getNodeById()` — for resolving parentId

  **Acceptance Criteria**:
  - [ ] 8 tools registered: create_rectangle, create_ellipse, create_line, create_frame, create_group, create_component, create_instance, create_text
  - [ ] All tools return `{ id, name, type }` on success
  - [ ] `create_frame` supports all auto-layout parameters
  - [ ] `create_text` loads font before setting content
  - [ ] `create_group` groups existing nodes by ID
  - [ ] `parentId` parameter works: node is appended to specified parent

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Create frame with auto-layout via MCP
    Tool: Bash
    Preconditions: Server running, plugin connected
    Steps:
      1. Send MCP tools/call for "create_frame" with {x:0, y:0, width:400, height:300, name:"TestFrame", layoutMode:"VERTICAL", itemSpacing:8, paddingTop:16, paddingRight:16, paddingBottom:16, paddingLeft:16}
      2. Assert: response contains id (non-empty string)
      3. Assert: response contains name "TestFrame"
      4. Send MCP tools/call for "get_node_by_id" with the returned id
      5. Assert: returned node has layoutMode "VERTICAL"
    Expected Result: Frame created with auto-layout properties
    Evidence: MCP responses captured

  Scenario: Create shape inside a parent frame
    Tool: Bash
    Preconditions: Frame from previous scenario exists
    Steps:
      1. Send "create_rectangle" with {x:0, y:0, width:100, height:50, parentId: "<frame-id>"}
      2. Assert: response has id
      3. Send "get_node_children" for the frame
      4. Assert: children array includes the rectangle
    Expected Result: Shape created inside parent
    Evidence: Responses captured
  ```

  **Commit**: YES
  - Message: `feat(tools): add node creation tools (shapes, frames, components, boolean ops)`
  - Files: `src/server/tools/create.ts, src/plugin/commands/create.ts`

---

- [x] 6. Styling Tools

  **What to do**:
  - Create `src/server/tools/style.ts` — register styling tools with MCP server
  - Create `src/plugin/commands/style.ts` — implement styling command handlers
  - Tools to implement (5 consolidated "power tools" — replaces 14 single-purpose tools):

    **Consolidated Style Tool:**
    - `set_style` — nodeId, plus ALL optional params in one call:
      - `fillColor?` — hex string or RGBA object (pass `null` to remove fill)
      - `strokeColor?` — hex string or RGBA (pass `null` to remove stroke)
      - `strokeWeight?` — number
      - `strokeAlign?` — INSIDE, OUTSIDE, CENTER
      - `cornerRadius?` — number (uniform) or `{topLeft, topRight, bottomRight, bottomLeft}` (per-corner)
      - `opacity?` — 0-1
      - `visible?` — boolean
    - This single tool replaces: set_fill_color, set_stroke_color, remove_fill, remove_stroke, set_corner_radius, set_opacity, set_visibility (7 tools → 1)
    - AI can set any combination in one call instead of sequential calls

    **Effects:**
    - `add_effect` — nodeId, type (DROP_SHADOW), color, offsetX?, offsetY?, blurRadius?, spread?
      - Only DROP_SHADOW for v1 (covers 95% of use cases)
    - `remove_effects` — nodeId (clear all effects)

    **Read:**
    - `get_node_style` — nodeId, returns complete style info (fills, strokes, effects, corner radius, opacity, blend mode)

    **Utility:**
    - `set_locked` — nodeId, locked (boolean)

  - Color inputs should accept BOTH hex strings ("#FF5500", "#FF550080") AND RGBA objects ({r,g,b,a}) — parse hex to RGBA in the server before sending to plugin
  - Implement a shared `parseColor` utility in `src/shared/color.ts`

  **Must NOT do**:
  - Do not implement gradient fills (niche, follow-up)
  - Do not implement inner shadow, blur, or background blur (niche, follow-up)
  - Do not implement blend modes (niche, follow-up)
  - Do not implement image fills (requires image data, follow-up)
  - Do not implement style library management (applying/creating shared styles)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 5 tools with color parsing, consolidated style handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5, 7, 8, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - Talk-to-Figma `set_fill_color`, `set_stroke_color`, `set_corner_radius` — shows RGBA color handling pattern and Figma fills/strokes array format
  - Talk-to-Figma `rgbaToHex()` utility — shows hex conversion (we need the reverse: hex → RGBA)

  **API/Type References**:
  - Figma Plugin API: `node.fills` (ReadonlyArray<Paint>), `node.strokes`, `node.effects` (ReadonlyArray<Effect>), `node.opacity`, `node.blendMode`, `node.visible`
  - Paint types: SolidPaint (`{type:'SOLID', color:{r,g,b}, opacity}`) and GradientPaint
  - Effect types: DropShadowEffect, InnerShadowEffect, BlurEffect, BackgroundBlurEffect

  **Acceptance Criteria**:
  - [ ] 5 tools registered for styling: set_style, add_effect, remove_effects, get_node_style, set_locked
  - [ ] `set_style` accepts hex "#FF5500" AND RGBA {r:1, g:0.33, b:0} for colors
  - [ ] `set_style` can set fill + stroke + corner radius + opacity in a single call
  - [ ] `set_style` with `fillColor: null` removes the fill
  - [ ] `add_effect` with type DROP_SHADOW adds shadow without removing existing effects
  - [ ] `get_node_style` returns complete style breakdown
  - [ ] `parseColor` utility correctly handles hex (3, 4, 6, 8 digit) and RGBA inputs

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: set_style applies multiple properties in one call
    Tool: Bash
    Preconditions: Server running, a rectangle exists in Figma
    Steps:
      1. Create a rectangle via MCP
      2. Send "set_style" with {nodeId: "<rect-id>", fillColor: "#FF5500", strokeColor: "#000000", strokeWeight: 2, cornerRadius: 8, opacity: 0.9}
      3. Send "get_node_style" for the rectangle
      4. Assert: fill color matches, stroke exists, corner radius is 8, opacity is 0.9
    Expected Result: All style properties applied in single call
    Evidence: Node style response captured

  Scenario: Add drop shadow effect
    Tool: Bash
    Preconditions: Rectangle exists
    Steps:
      1. Send "add_effect" with {nodeId: "<id>", type: "DROP_SHADOW", color: "#00000040", offsetX: 0, offsetY: 4, blurRadius: 8}
      2. Send "get_node_style"
      3. Assert: effects array has DROP_SHADOW entry
    Expected Result: Shadow added to node
    Evidence: Response captured
  ```

  **Commit**: YES
  - Message: `feat(tools): add styling tools (fills, strokes, effects, appearance)`
  - Files: `src/server/tools/style.ts, src/plugin/commands/style.ts, src/shared/color.ts`

---

- [x] 7. Layout & Auto-Layout Tools

  **What to do**:
  - Create `src/server/tools/layout.ts` — register layout tools with MCP server
  - Create `src/plugin/commands/layout.ts` — implement layout command handlers
  - Tools to implement (6 tools — merged position/size into move/resize in Task 9, cut constraints):

    **Auto-Layout:**
    - `set_auto_layout` — nodeId, direction (HORIZONTAL, VERTICAL, NONE — NONE removes auto-layout), options: { paddingTop?, paddingRight?, paddingBottom?, paddingLeft?, itemSpacing?, primaryAxisAlignItems? (MIN, MAX, CENTER, SPACE_BETWEEN), counterAxisAlignItems? (MIN, MAX, CENTER, BASELINE), layoutWrap? (NO_WRAP, WRAP), counterAxisSpacing? }
    - `set_layout_sizing` — nodeId, horizontal (FIXED, HUG, FILL), vertical (FIXED, HUG, FILL)
    - `set_layout_align` — childNodeId, layoutAlign (STRETCH, INHERIT), layoutGrow? (0 or 1)

    **Transform:**
    - `move_node` — nodeId, x, y (replaces separate set_position)
    - `resize_node` — nodeId, width, height (replaces separate set_size)
    - `set_rotation` — nodeId, rotation (degrees)

  **Must NOT do**:
  - Do not implement constraints (only needed for non-auto-layout, niche — follow-up)
  - Do not implement reorder_child (can be done via reparent_node in Task 9)
  - Do not implement grid layout (Figma-specific advanced feature, follow-up)
  - Do not implement absolute positioning within auto-layout (complex edge case)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Auto-layout has many interacting properties, careful API usage needed
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5, 6, 8, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - Talk-to-Figma `create_frame` tool — shows all auto-layout parameters (layoutMode, padding, itemSpacing, primaryAxisAlignItems, counterAxisAlignItems, layoutSizingHorizontal, layoutSizingVertical)
  - Talk-to-Figma `move_node`, `resize_node` — shows position/size setting patterns

  **API/Type References**:
  - Figma Plugin API auto-layout: `node.layoutMode`, `node.primaryAxisAlignItems`, `node.counterAxisAlignItems`, `node.paddingTop/Right/Bottom/Left`, `node.itemSpacing`, `node.layoutWrap`, `node.counterAxisSpacing`, `node.layoutSizingHorizontal`, `node.layoutSizingVertical`
  - Child auto-layout: `child.layoutAlign`, `child.layoutGrow`
  - Constraints: `node.constraints` (`{horizontal: ConstraintType, vertical: ConstraintType}`)
  - Position/size: `node.x`, `node.y`, `node.resize(width, height)`, `node.rotation`

  **Acceptance Criteria**:
  - [ ] 6 tools registered for layout: set_auto_layout, set_layout_sizing, set_layout_align, move_node, resize_node, set_rotation
  - [ ] `set_auto_layout` can configure a frame as vertical auto-layout with padding and spacing
  - [ ] `set_auto_layout` with direction NONE removes auto-layout (replaces separate remove_auto_layout)
  - [ ] `set_layout_sizing` changes a child's sizing to FILL or HUG

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Configure auto-layout on existing frame
    Tool: Bash
    Preconditions: Frame exists in Figma
    Steps:
      1. Create a frame via MCP
      2. Send "set_auto_layout" with {nodeId: "<id>", direction: "VERTICAL", options: {paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, itemSpacing: 8}}
      3. Send "get_node_by_id"
      4. Assert: layoutMode is "VERTICAL"
      5. Assert: paddingTop is 16
      6. Assert: itemSpacing is 8
    Expected Result: Auto-layout configured on frame
    Evidence: Response captured
  ```

  **Commit**: YES
  - Message: `feat(tools): add layout and auto-layout tools`
  - Files: `src/server/tools/layout.ts, src/plugin/commands/layout.ts`

---

- [x] 8. Text Tools

  **What to do**:
  - Create `src/server/tools/text.ts` — register text tools with MCP server
  - Create `src/plugin/commands/text.ts` — implement text command handlers
  - Tools to implement (4 tools — cut insert_text, delete_text_range, scan_text_nodes, individual styling tools; merged text styling into one power tool):

    **Text Content:**
    - `set_text_content` — nodeId, text (replaces full text content). Handles font loading automatically.

    **Text Styling (consolidated):**
    - `set_text_style` — nodeId, all optional: fontFamily?, fontSize?, fontWeight?, fontColor? (hex or RGBA), textAlignHorizontal? (LEFT, CENTER, RIGHT, JUSTIFIED), textAlignVertical? (TOP, CENTER, BOTTOM), textAutoResize? (NONE, WIDTH_AND_HEIGHT, HEIGHT, TRUNCATE), textDecoration? (NONE, UNDERLINE, STRIKETHROUGH)
      - Replaces 6 separate tools: set_font_properties, set_text_color, set_text_decoration, set_text_alignment, set_line_height, set_letter_spacing, set_text_auto_resize
      - Applies to full text node (no range support in v1 — keeps it simple)

    **Text Reading:**
    - `get_text_content` — nodeId, returns text content + current style info

    NOTE: `create_text` is defined in Task 5 and accepts initial styling params at creation time, reducing the need for follow-up styling calls.

  - **CRITICAL**: Every text operation that modifies text or font must first call `figma.loadFontAsync({family, style})`. The handler must:
    1. Read current font from the text node
    2. Load it with `figma.loadFontAsync()`
    3. If changing font family/weight, load the new font too
    4. Then apply changes
  - For `create_text`: load font before setting any text content (default: Inter Regular or whatever is available)

  **Must NOT do**:
  - Do not implement range-based text styling (full-node only in v1)
  - Do not implement insert_text or delete_text_range (set_text_content covers 99% of needs)
  - Do not implement scan_text_nodes (bulk operation, follow-up)
  - Do not implement OpenType features
  - Do not implement text styles (shared library styles)
  - Do not skip font loading — it WILL throw errors

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Text is the trickiest Figma API surface — font loading, async operations
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5, 6, 7, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - Talk-to-Figma `create_text` and `set_text_content` tools — shows font loading pattern (loadFontAsync before setting characters), fontWeight/fontFamily handling
  - Talk-to-Figma `scan_text_nodes` tool — shows chunking pattern for large page scans with progress updates

  **API/Type References**:
  - Figma Plugin API: `figma.createText()`, `figma.loadFontAsync({family, style})`, `node.characters`, `node.fontName`, `node.fontSize`, `node.insertCharacters()`, `node.deleteCharacters()`, `node.setRangeFontSize()`, `node.setRangeFills()`, `node.textAlignHorizontal`, `node.textAutoResize`
  - Font style mapping: fontWeight 400 → "Regular", 700 → "Bold", etc.

  **Acceptance Criteria**:
  - [ ] 3 tools registered for text: set_text_content, set_text_style, get_text_content (create_text is in Task 5)
  - [ ] `set_text_content` loads current font before replacing text (no "font not loaded" errors)
  - [ ] `set_text_style` can set font + color + alignment + resize in one call
  - [ ] `set_text_style` loads new font when fontFamily/fontWeight changes
  - [ ] Error messages clearly state which font failed to load

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Create text node and modify content
    Tool: Bash
    Preconditions: Server and plugin connected
    Steps:
      1. Send "create_text" with {x:0, y:0, text: "Hello World", fontSize: 24}
      2. Assert: response has id and name
      3. Send "set_text_content" with {nodeId: "<id>", text: "Updated Text"}
      4. Send "get_text_content" with {nodeId: "<id>"}
      5. Assert: content equals "Updated Text"
    Expected Result: Text created and updated without font errors
    Evidence: Responses captured

  Scenario: Font loading error handled gracefully
    Tool: Bash
    Preconditions: Server and plugin connected
    Steps:
      1. Create text node
      2. Send "set_font_properties" with {nodeId: "<id>", fontFamily: "NonExistentFont12345"}
      3. Assert: response contains error about font not available
      4. Assert: original text is unchanged
    Expected Result: Graceful error, no crash
    Evidence: Error response captured
  ```

  **Commit**: YES
  - Message: `feat(tools): add text creation and manipulation tools with font loading`
  - Files: `src/server/tools/text.ts, src/plugin/commands/text.ts`

---

- [x] 9. Node Manipulation, Export, & Component Tools

  **What to do**:
  - Create `src/server/tools/manipulate.ts` — node manipulation tools
  - Create `src/server/tools/export.ts` — export tools
  - Create `src/server/tools/components.ts` — component tools
  - Create corresponding `src/plugin/commands/manipulate.ts`, `export.ts`, `components.ts`
  - Tools to implement (8 tools — cut flatten_node, set_locked (moved to styling), delete_multiple_nodes, batch_create, get_instance_overrides, reset_instance, detach_instance):

    **Node Manipulation:**
    - `delete_node` — nodeId (or nodeIds array — handles single and bulk delete)
    - `clone_node` — nodeId, x?, y? (position for clone)
    - `rename_node` — nodeId, name
    - `reparent_node` — nodeId, newParentId, index? (move node to different parent, also serves as reorder)

    **Export:**
    - `export_node_as_image` — nodeId, format (PNG, JPG, SVG, PDF), scale? (default 1x)
      - Returns base64-encoded image data with mimeType
      - Use longer timeout (60s) for large exports
      - `Uint8Array` from exportAsync → base64 encode → send over WS as string

    **Components:**
    - `get_local_components` — list all local components (id, name, key, description)

    NOTE: `create_instance` is in Task 5. `move_node` and `resize_node` are in Task 7.

  **Must NOT do**:
  - Do not implement flatten_node (niche, follow-up)
  - Do not implement batch_create (premature optimization, follow-up)
  - Do not implement detach_instance, get_instance_overrides, reset_instance (advanced component ops, follow-up)
  - Do not implement component variant manipulation (complex, follow-up)
  - Do not implement shared/team library component operations
  - Do not implement swap instance (complex override handling)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Focused set of tools, export requires binary data handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5, 6, 7, 8)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - Talk-to-Figma `move_node`, `resize_node`, `delete_node`, `clone_node`, `export_node_as_image` — parameter patterns, base64 image return format
  - Talk-to-Figma `get_local_components`, `create_component_instance`, `get_instance_overrides`, `set_instance_overrides` — component handling patterns

  **API/Type References**:
  - Figma Plugin API: `node.x`, `node.y`, `node.resize()`, `node.remove()`, `node.clone()`, `node.name`, `node.parent`, `node.locked`
  - Export: `node.exportAsync({format, contentsOnly?, constraint?})` → `Uint8Array`
  - Components: `figma.root.findAllWithCriteria({types:['COMPONENT']})`, `component.key`, `component.createInstance()`, `instance.detachInstance()`, `instance.resetOverrides()`
  - Reparent: `newParent.insertChild(index, node)`
  - Flatten: `figma.flatten([node])`

  **Acceptance Criteria**:
  - [ ] 6 tools registered: delete_node, clone_node, rename_node, reparent_node, export_node_as_image, get_local_components
  - [ ] `delete_node` handles both single nodeId and nodeIds array
  - [ ] `clone_node` creates a copy at specified position
  - [ ] `reparent_node` moves node to new parent at correct index
  - [ ] `export_node_as_image` returns valid base64 PNG data
  - [ ] `get_local_components` lists all components with keys

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Clone and move a node
    Tool: Bash
    Preconditions: Server running, rectangle exists
    Steps:
      1. Create a rectangle at (0, 0)
      2. Send "clone_node" with {nodeId: "<id>", x: 200, y: 0}
      3. Assert: response has new id (different from original)
      4. Send "get_node_by_id" for the clone
      5. Assert: position is (200, 0)
    Expected Result: Node cloned at new position
    Evidence: Responses captured

  Scenario: Export node as PNG
    Tool: Bash
    Preconditions: Frame exists with content
    Steps:
      1. Send "export_node_as_image" with {nodeId: "<id>", format: "PNG", scale: 2}
      2. Assert: response contains base64 data string
      3. Assert: response contains mimeType "image/png"
      4. Assert: base64 data decodes to valid PNG (starts with PNG header)
    Expected Result: Valid PNG image exported
    Evidence: Response with image data captured
  ```

  **Commit**: YES
  - Message: `feat(tools): add node manipulation, export, and component tools`
  - Files: `src/server/tools/manipulate.ts, src/server/tools/export.ts, src/server/tools/components.ts, src/plugin/commands/manipulate.ts, src/plugin/commands/export.ts, src/plugin/commands/components.ts`

---

- [x] 10. Integration, Polish & Documentation

  **What to do**:
  - Wire all tool modules together in `src/server/index.ts`:
    - Import and register all tool modules (document, create, style, layout, text, manipulate, export, components)
    - Verify total tool count matches expected (~70)
  - Wire all command modules together in `src/plugin/commands/index.ts`:
    - Import and register all command handlers
    - Verify command map covers all tool types
  - Add MCP prompts (design strategy, implementation hints):
    - `design_strategy` prompt — guidance for AI on how to approach Figma design tasks
    - `component_hierarchy` prompt — guidance on proper parent-child structuring
  - Create/update `README.md`:
    - Project overview and architecture diagram
    - Setup instructions (bun install, build, start)
    - MCP client configuration examples:
      - Claude Desktop: `claude_desktop_config.json` snippet
      - Cursor: `.cursor/mcp.json` snippet
      - OpenCode: `opencode.json` snippet
    - Tool reference (table of all tools with descriptions)
    - Troubleshooting (WebSocket connection, font issues, etc.)
  - Update `manifest.json` if any final adjustments needed
  - End-to-end smoke test: create a complete small UI layout using only MCP tools

  **Must NOT do**:
  - Do not add features not in the plan
  - Do not refactor working tools
  - Do not add analytics or telemetry

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration requires understanding all components, docs need clarity
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (alone — final integration)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 4, 5, 6, 7, 8, 9

  **References**:

  **Pattern References**:
  - All `src/server/tools/*.ts` files (from Tasks 4-9) — import and register
  - All `src/plugin/commands/*.ts` files (from Tasks 4-9) — import and register
  - Talk-to-Figma `design_strategy` prompt — server.ts bottom — MCP prompt for AI design guidance

  **External References**:
  - MCP client config format for Claude Desktop: https://docs.anthropic.com/en/docs/agents-and-tools/mcp
  - Cursor MCP config: https://docs.cursor.com/context/model-context-protocol

  **Acceptance Criteria**:
  - [ ] `bun run server` starts and `tools/list` returns ~42 tools
  - [ ] Plugin connects, all tool categories work end-to-end
  - [ ] README.md has setup instructions, MCP config examples, and tool reference
  - [ ] Smoke test: create a card component (frame + auto-layout + text + rectangle background + shadow) using only MCP tool calls
  - [ ] MCP prompts registered and accessible

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: End-to-end smoke test — create a UI card
    Tool: Bash
    Preconditions: Server running, plugin connected in Figma
    Steps:
      1. create_frame: {x:0, y:0, width:320, height:200, name:"Card", layoutMode:"VERTICAL", paddingTop:16, paddingRight:16, paddingBottom:16, paddingLeft:16, itemSpacing:8, fillColor:{r:1,g:1,b:1}}
      2. set_style: {nodeId: <card-id>, cornerRadius: 12}
      3. add_effect: {nodeId: <card-id>, type:"DROP_SHADOW", color:"#00000020", offsetX:0, offsetY:2, blurRadius:8}
      4. create_text: {text:"Card Title", fontSize:18, fontWeight:700, parentId:<card-id>}
      5. create_text: {text:"This is a description of the card content.", fontSize:14, parentId:<card-id>}
      6. create_frame: {width:288, height:40, name:"Button", parentId:<card-id>, layoutMode:"HORIZONTAL", primaryAxisAlignItems:"CENTER", counterAxisAlignItems:"CENTER", fillColor:{r:0.2,g:0.4,b:1}}
      7. set_style: {nodeId:<button-id>, cornerRadius:8}
      8. create_text: {text:"Click Me", fontSize:14, fontWeight:600, fontColor:{r:1,g:1,b:1}, parentId:<button-id>}
      9. set_layout_sizing: {nodeId:<button-id>, horizontal:"FILL", vertical:"HUG"}
      10. zoom_to_fit: {nodeIds:[<card-id>]}
      11. Assert: all 10 commands succeed without errors
      12. get_node_children for card: Assert 3 children (title text, description text, button frame)
    Expected Result: Complete UI card created and visible in Figma
    Evidence: All MCP responses captured, final screenshot via export_node_as_image

  Scenario: Tool count verification
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. Send MCP tools/list request
      2. Count tools in response
      3. Assert: count >= 38 and <= 48
      4. Assert: tools include representatives from each category (document, create, style, layout, text, manipulate, export, components)
    Expected Result: Comprehensive tool set registered
    Evidence: tools/list response captured
  ```

  **Commit**: YES
  - Message: `feat(rune): integrate all tools, add MCP prompts and documentation`
  - Files: `src/server/index.ts, src/plugin/commands/index.ts, README.md`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(setup): initialize rune project with bun, shared types, and build system` | package.json, tsconfig, manifest, src/shared/ | bun run build:plugin succeeds |
| 2 | `feat(server): add MCP server infrastructure with WebSocket bridge` | src/server/ | bun run server starts, WS accepts connections |
| 3 | `feat(plugin): add Figma plugin bridge with WebSocket client and command dispatch` | src/plugin/ | Plugin builds, connects to WS |
| 4 | `feat(tools): add document, navigation, selection, and viewport tools` | src/server/tools/document.ts, src/plugin/commands/document.ts | 12 tools registered |
| 5 | `feat(tools): add node creation tools (shapes, frames, text, components)` | src/server/tools/create.ts, src/plugin/commands/create.ts | 8 tools registered |
| 6 | `feat(tools): add consolidated styling tools (set_style, effects)` | src/server/tools/style.ts, src/plugin/commands/style.ts, src/shared/color.ts | 5 tools registered |
| 7 | `feat(tools): add layout, auto-layout, and transform tools` | src/server/tools/layout.ts, src/plugin/commands/layout.ts | 6 tools registered |
| 8 | `feat(tools): add text content and styling tools with font loading` | src/server/tools/text.ts, src/plugin/commands/text.ts | 3 tools registered |
| 9 | `feat(tools): add node manipulation, export, and component listing` | src/server/tools/*.ts, src/plugin/commands/*.ts | 6 tools registered |
| 10 | `feat(rune): integrate all tools, add MCP prompts and documentation` | src/server/index.ts, README.md | ~42 tools, smoke test passes |

---

## Success Criteria

### Verification Commands
```bash
bun run build:plugin  # Expected: clean build, code.js + ui.html output
bun run server        # Expected: "MCP server started", "WebSocket bridge listening on ws://localhost:3055"
# In MCP client: tools/list → Expected: ~42 tools across 8 categories
# In Figma with plugin open: Expected: "Connected" status
```

### Final Checklist
- [x] All "Must Have" categories present (Document, Selection, Creation, Styling, Layout, Text, Components, Export, Viewport, Manipulation)
- [x] All "Must NOT Have" absent (no AI/LLM, no chat UI, no FigJam, no auth, no TLS)
- [x] Plugin stays open indefinitely (never calls closePlugin)
- [x] Auto-reconnect works after server restart
- [x] Font loading before all text operations
- [x] Large node trees are paginated/chunked
- [x] Errors return meaningful messages to AI client
- [x] README has MCP client config for Claude, Cursor, and OpenCode
- [x] Smoke test: UI card created successfully via MCP tools
