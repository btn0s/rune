# Issues — Rune Figma MCP

## Known Gotchas (from research)
- Font loading MUST happen before ANY text operations (figma.loadFontAsync)
- Plugin UI can reload unexpectedly → auto-reconnect with backoff required
- Plugin terminates on file switch → graceful disconnect + timeout pending requests
- Large node trees need pagination/chunking
- postMessage requires JSON serialization (no functions, DOM nodes, circular refs)
- Logger MUST write to stderr only (stdout reserved for MCP stdio)
- manifest.json networkAccess needs port number + reasoning field

## Problems Encountered
- TBD (agents will append)
