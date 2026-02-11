import { startMcpServer, mcpServer } from "./mcp";
import { startBridge } from "./bridge";
import { logger } from "./logger";
import "./tools/create";
import "./tools/document";
import "./tools/layout";
import "./tools/style";
import "./tools/manipulate";
import "./tools/components";
import "./tools/text";
import "./tools/batch";
import "./tools/search";
import "./tools/transfer";
import "./tools/fonts";
import "./tools/tokens";
import "./tools/export";
import "./tools/connection";

// ─── MCP Prompts ──────────────────────────────────────────────────────────────

mcpServer.registerPrompt("design_strategy", {
  title: "Design Strategy",
  description:
    "Guidance for AI on how to approach Figma design tasks using Rune MCP tools. Covers best practices for creating UI components, structuring layouts, and applying styles.",
}, async () => ({
  messages: [
    {
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `You are an expert UI designer working in Figma through the Rune MCP server. Follow these guidelines:

## General Approach
1. **Always start by inspecting the document**: Use \`get_document_info\` and \`get_node_children\` to understand the current page structure before making changes.
2. **Use auto-layout for everything**: Prefer \`create_frame\` with \`layoutMode: "VERTICAL"\` or \`"HORIZONTAL"\` over absolute positioning. This makes designs responsive and maintainable.
3. **Name every node**: Always provide a descriptive \`name\` parameter when creating nodes. Good naming = good layer panel organization.
4. **Build from the inside out**: Create child elements first, then wrap them in parent frames. This follows Figma's natural composition model.

## Layout Best Practices
- Use \`VERTICAL\` auto-layout for page sections, cards, form fields
- Use \`HORIZONTAL\` auto-layout for rows, button groups, nav bars
- Set \`itemSpacing\` for consistent gaps between children
- Use \`paddingTop/Right/Bottom/Left\` for internal spacing
- Apply \`layoutSizingHorizontal: "FILL"\` on children that should stretch to fill their parent

## Styling Best Practices
- Use \`set_style\` to apply fills, strokes, corner radius, and opacity in a single call
- Use hex colors ("#RRGGBB") for convenience — they're auto-converted to RGBA
- Add \`add_effect\` with DROP_SHADOW for elevation/depth (e.g. cards, modals, buttons)
- Use consistent corner radii: 4px for small elements, 8px for cards, 12-16px for modals

## Text Best Practices
- Load fonts implicitly: \`create_text\` handles font loading automatically
- Use \`fontWeight: 700\` for headings, \`400\` for body text
- Standard sizes: 12px caption, 14px body, 16px subheading, 20-24px heading, 32px+ display
- Set \`textAlignHorizontal\` to match the layout context

## Component Workflow
1. Design the element with frames, text, shapes
2. Use \`create_component\` for reusable elements
3. Use \`get_local_components\` to list available components
4. Use \`create_instance\` to reuse components across the design

## Verification
- After creating a composition, use \`get_node_children\` to verify the structure
- Use \`zoom_to_fit\` to bring the result into view
- Use \`get_node_style\` to verify styling was applied correctly`,
      },
    },
  ],
}));

mcpServer.registerPrompt("component_hierarchy", {
  title: "Component Hierarchy",
  description:
    "Guidance on structuring parent-child relationships and component composition in Figma designs.",
}, async () => ({
  messages: [
    {
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `When building Figma designs through MCP tools, follow this hierarchy pattern:

## Node Hierarchy (parent → child)
\`\`\`
Page
└── Frame (section/screen — VERTICAL auto-layout)
    ├── Frame (header — HORIZONTAL auto-layout)
    │   ├── Text (title)
    │   └── Frame (actions — HORIZONTAL auto-layout)
    │       └── Frame (button — HORIZONTAL, with fill + radius)
    │           └── Text (button label)
    ├── Frame (content area — VERTICAL auto-layout)
    │   ├── Frame (card — VERTICAL, with fill + shadow + radius)
    │   │   ├── Text (card title)
    │   │   ├── Text (card description)
    │   │   └── Frame (card footer — HORIZONTAL)
    │   └── ...more cards
    └── Frame (footer — HORIZONTAL auto-layout)
\`\`\`

## Key Rules
1. **Frames are containers**: Use \`create_frame\` with auto-layout for ALL containers. Never use groups for layout.
2. **parentId chains**: When creating children, always pass the parent's \`id\` as \`parentId\`. Example:
   - Create outer frame → get its id
   - Create inner elements with \`parentId: outerFrame.id\`
3. **Sizing modes matter**:
   - Container frames: \`layoutSizingHorizontal: "FILL"\` to stretch, \`"HUG"\` to shrink-wrap
   - Text nodes: Usually HUG in both directions (auto-sized)
   - Buttons: \`"HUG"\` vertically, \`"FILL"\` or \`"HUG"\` horizontally depending on context
4. **Order = visual order**: Children are stacked in creation order. First child appears at the top (vertical) or left (horizontal).
5. **Reparenting**: Use \`reparent_node\` to move nodes between parents after creation if needed.

## Common Patterns

### Card Component
1. \`create_frame\` — card (VERTICAL, padding 16, itemSpacing 8, white fill, cornerRadius 8)
2. \`add_effect\` — drop shadow on card
3. \`create_text\` — title (bold, 18px, parentId: card)
4. \`create_text\` — description (regular, 14px, parentId: card)

### Button
1. \`create_frame\` — button (HORIZONTAL, padding 8/16, cornerRadius 6, blue fill)
2. \`create_text\` — label (white, 14px, fontWeight 600, parentId: button)
3. \`set_layout_sizing\` — button HUG vertical, FILL or HUG horizontal

### Form Field
1. \`create_frame\` — field wrapper (VERTICAL, itemSpacing 4)
2. \`create_text\` — label (12px, medium weight, parentId: wrapper)
3. \`create_frame\` — input (HORIZONTAL, padding 8/12, border stroke, cornerRadius 4, parentId: wrapper)
4. \`create_text\` — placeholder text (14px, gray, parentId: input)`,
      },
    },
  ],
}));

async function main(): Promise<void> {
  startBridge();
  await startMcpServer();

  process.stdin.on("end", () => {
    logger.info("stdin closed — MCP client disconnected, shutting down");
    process.exit(0);
  });

  process.stdin.on("close", () => {
    logger.info("stdin close event — shutting down");
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
