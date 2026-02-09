# Learnings — Rune Figma MCP

## Conventions
- TBD (agents will append findings)

## Patterns
- TBD (agents will append findings)

## Gotchas
- TBD (agents will append findings)
# Rune Figma MCP - Learnings

## Task 1: Project Setup & Build System

### Key Decisions
1. **Bun as unified toolchain**: Using Bun for package management, bundling, and runtime. Simplifies build pipeline vs npm + webpack.
2. **Shared types pattern**: Created `src/shared/` directory with `protocol.ts` and `types.ts` for reusable interfaces between plugin and server.
3. **Path aliases in tsconfig**: Added `@shared/*` path alias for clean imports across plugin and server code.
4. **Build output to dist/**: All built artifacts go to `dist/` directory, referenced in manifest.json.

### Build Scripts
- `build:plugin`: Uses `bun build` with `--target browser` to bundle plugin code, copies ui.html to dist
- `build:server`: Prepared for future server bundling (Bun can run .ts directly, but script available)
- `server`: Runs MCP server directly with Bun
- `dev`: Watch mode for plugin development

### Dependencies Installed
- `@modelcontextprotocol/sdk@1.26.0`: MCP protocol implementation
- `zod@3.25.76`: Schema validation (for future use)
- `@figma/plugin-typings@1.123.0`: Figma API types
- TypeScript 5.9.3 with strict mode enabled

### Type System
- **CommandMessage**: `{ id, type, params }` - plugin → server communication
- **ResponseMessage**: `{ id, result?, error? }` - server → plugin responses
- **StatusMessage**: `{ type: 'connected'|'disconnected'|'error', message }` - status updates
- **RGBA, Bounds, NodeInfo**: Figma document model types for future tool implementations

### Manifest Updates
- Plugin ID preserved: `1602795503714672621`
- Network access: Limited to `["localhost"]` for MCP server
- Editor type: Figma only (removed figjam, slides, buzz)
- File paths: Updated to point to `dist/code.js` and `dist/ui.html`

### Build Verification
✅ `bun install` succeeded with 222 packages
✅ `bun run build:plugin` produces `dist/code.js` (384 bytes) and `dist/ui.html`
✅ `bunx tsc --noEmit` on shared types compiles without errors
✅ Plugin code imports shared types successfully

### Next Steps (Task 2+)
- Create MCP server implementation in `src/server/index.ts`
- Implement WebSocket bridge for plugin ↔ server communication
- Add tool handlers for Figma operations (Tasks 4-9)

## Task 3: Figma Plugin Bridge (UI Thread + Main Thread)

### Architecture
- **UI thread** (ui.html): Runs in iframe sandbox, has network access (WebSocket), no Figma API
- **Main thread** (code.ts): Has Figma API access, no network. Communicates with UI via postMessage
- **Command registry** (commands/index.ts): Map<string, CommandHandler> — empty for now, populated by Tasks 4-9

### Key Patterns
1. **Message flow**: Server → WS → UI thread → postMessage → Main thread → commandRegistry → postMessage → UI thread → WS → Server
2. **Auto-reconnect**: Exponential backoff starting at 1s, doubling each attempt, max 30s. Resets on successful connection.
3. **clientStorage bridge**: UI sends `{ type: 'client_storage_set/get', storage_key, ... }` to main thread which proxies `figma.clientStorage` calls
4. **Command dispatch**: Map-based lookup. Unknown commands return `{ id, error: "Unknown command: <type>" }`. All execution wrapped in try/catch.
5. **Plugin persistence**: NEVER call `figma.closePlugin()`. Plugin stays running as persistent bridge.
6. **Cleanup**: `figma.on('close')` sends `plugin_closing` to UI, which sends `plugin_disconnected` to server and closes WS.

### Build Output
- `dist/code.js`: 1.19 KB — contains bundled main thread code
- `dist/ui.html`: 3.7 KB — copied as-is (not bundled, contains inline JS/CSS)
- Build command: `bun build src/plugin/code.ts --outfile dist/code.js --target browser && cp src/plugin/ui.html dist/ui.html`

### Gotchas
- Bun's `--target browser` bundles imports but doesn't resolve `@shared/*` path aliases for the plugin (not needed since commands/index.ts uses relative imports)
- ui.html uses plain JS (not TypeScript) since it's copied directly, not compiled
- `figma.on('close')` fires when user switches files or closes plugin — must handle gracefully
- WebSocket `new WebSocket()` can throw in some environments — wrapped in try/catch
