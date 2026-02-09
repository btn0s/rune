# Decisions — Rune Figma MCP

## Architectural Choices
- Combined MCP + WebSocket in single Bun process (not separate like Talk-to-Figma)
- ws://localhost (no TLS initially)
- Single connection model (one Figma file at a time)
- ~42 tools (trimmed from 70 for AI token efficiency)

## Technology Stack
- Bun (runtime, bundler, package manager)
- MCP SDK v2 with `registerTool()` syntax
- Native Bun.serve() for WebSocket (no external ws library)
- TypeScript throughout

## Build Decisions
- TBD (agents will append)
