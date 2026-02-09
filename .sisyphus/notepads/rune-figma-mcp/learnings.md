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
