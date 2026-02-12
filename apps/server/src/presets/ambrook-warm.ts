import type { StylePreset } from "./types";

export const ambrookWarm: StylePreset = {
  name: "ambrook-warm",
  description:
    "Warm, earthy palette inspired by Ambrook's agricultural fintech brand. " +
    "Cream backgrounds, olive/sage accents, and a grounded neutral type scale.",
  font: "Inter",
  colors: {
    "text.primary": {
      hex: "#2C2B28",
      description: "Headings, body text, labels",
    },
    "text.secondary": {
      hex: "#8A8778",
      description: "Helper text, muted labels, hints",
    },
    "text.accent": {
      hex: "#4A7C59",
      description: 'Positive values ("Free"), links',
    },
    "border.default": {
      hex: "#D4D0C8",
      description: "Input borders, dividers",
    },
    "border.active": {
      hex: "#5C5A4F",
      description: "Focused/expanded input borders",
    },
    "surface.page": {
      hex: "#FAF7F2",
      description: "Page/card background",
    },
    "surface.card": {
      hex: "#FFFFFF",
      description: "Input/option backgrounds",
    },
    "surface.selected": {
      hex: "#F5F3EE",
      description: "Selected option tint",
    },
    "surface.hover": {
      hex: "#E7E4DE",
      description: "Hover states",
    },
    "radio.selected": {
      hex: "#5C6B4F",
      description: "Filled radio/checkbox accent",
    },
  },
  typeScale: {
    "type.title": {
      fontSize: 18,
      fontWeight: 600,
      description: "Section/exploration titles",
    },
    "type.body": {
      fontSize: 14,
      fontWeight: 500,
      description: "Option names, primary content",
    },
    "type.bodyRegular": {
      fontSize: 14,
      fontWeight: 400,
      description: "Body text",
    },
    "type.caption": {
      fontSize: 13,
      fontWeight: 500,
      description: "Secondary values (cost, timing)",
    },
    "type.hint": {
      fontSize: 12,
      fontWeight: 400,
      description: "Helper text, descriptions",
    },
    "type.micro": {
      fontSize: 11,
      fontWeight: 400,
      description: "Tertiary info, smallest text",
    },
    "type.label": {
      fontSize: 10,
      fontWeight: 600,
      description: "Uppercase state labels",
    },
  },
  spacing: {
    "space.xs": { value: 2, description: "Tight inline gaps" },
    "space.sm": { value: 4, description: "Icon-to-text gaps" },
    "space.md": { value: 8, description: "Default item spacing" },
    "space.lg": { value: 14, description: "Padding inside cards/rows" },
    "space.xl": { value: 24, description: "Section padding, card insets" },
  },
  radii: {
    "radius.sm": { value: 3, description: "Icon placeholders, small elements" },
    "radius.md": { value: 4, description: "Chips, badges" },
    "radius.lg": { value: 8, description: "Inputs, cards, containers" },
  },
  shadows: {
    "shadow.dropdown": {
      offsetX: 0,
      offsetY: 4,
      blurRadius: 12,
      color: "#00000014",
      description: "Dropdown panels, popovers",
    },
  },
  roles: {
    page: {
      tokens: ["surface.page"],
      description: "Page-level background",
    },
    card: {
      tokens: ["surface.card", "radius.lg"],
      description: "Content card with rounded corners",
    },
    "card.elevated": {
      tokens: ["surface.card", "radius.lg", "shadow.dropdown"],
      description: "Elevated card with shadow (dropdowns, popovers)",
    },
    input: {
      tokens: ["surface.card", "border.default", "radius.lg"],
      description: "Default text input / select",
    },
    "input.focused": {
      tokens: ["surface.card", "border.active", "radius.lg"],
      description: "Focused / expanded input",
    },
    option: {
      tokens: ["surface.card", "radius.lg"],
      description: "Selectable option row",
    },
    "option.selected": {
      tokens: ["surface.selected", "radius.lg"],
      description: "Currently selected option row",
    },
    divider: {
      tokens: ["border.default"],
      description: "Horizontal rule / separator",
    },
    title: {
      tokens: ["type.title", "text.primary"],
      description: "Section heading",
    },
    body: {
      tokens: ["type.body", "text.primary"],
      description: "Primary content text (medium weight)",
    },
    "body.regular": {
      tokens: ["type.bodyRegular", "text.primary"],
      description: "Body text (regular weight)",
    },
    caption: {
      tokens: ["type.caption", "text.secondary"],
      description: "Secondary value text (cost, timing)",
    },
    hint: {
      tokens: ["type.hint", "text.secondary"],
      description: "Helper / description text",
    },
    label: {
      tokens: ["type.label", "text.secondary"],
      description: "Uppercase state label",
    },
    micro: {
      tokens: ["type.micro", "text.secondary"],
      description: "Smallest tertiary text",
    },
    link: {
      tokens: ["type.body", "text.accent"],
      description: "Clickable link or positive value",
    },
    accent: {
      tokens: ["type.bodyRegular", "text.accent"],
      description: "Accent-colored text (regular weight)",
    },
    radio: {
      tokens: ["radio.selected", "radius.sm"],
      description: "Selected radio / checkbox indicator",
    },
    chip: {
      tokens: ["surface.selected", "radius.md"],
      description: "Tag / chip / badge",
    },
  },
};
