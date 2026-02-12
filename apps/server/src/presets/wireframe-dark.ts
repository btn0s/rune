import type { StylePreset } from "./types";

export const wireframeDark: StylePreset = {
  name: "wireframe-dark",
  description:
    "Dark wireframe preset with charcoal backgrounds, white/grey text hierarchy, " +
    "pill-shaped badges, and SF Pro type scale.",
  font: "SF Pro",
  colors: {
    "text.primary": {
      hex: "#FFFFFF",
      description: "Headings, bold body text, primary content",
    },
    "text.secondary": {
      hex: "#FFFFFF80",
      description: "Regular body text, muted labels (50% white)",
    },
    "text.tertiary": {
      hex: "#9A9A9A",
      description: "Hints, timestamps, helper text",
    },
    "border.default": {
      hex: "#FFFFFF33",
      description: "Subtle borders, dividers (20% white)",
    },
    "border.active": {
      hex: "#FFFFFF80",
      description: "Focused/active borders (50% white)",
    },
    "surface.page": {
      hex: "#353535",
      description: "Page/screen background",
    },
    "surface.card": {
      hex: "#FFFFFF1A",
      description: "Card/panel backgrounds (10% white)",
    },
    "surface.selected": {
      hex: "#FFFFFF33",
      description: "Selected/active states (20% white)",
    },
    "surface.overlay": {
      hex: "#E8E8E5",
      description: "High-contrast overlay elements, badges",
    },
    "accent.badge": {
      hex: "#E8E8E5",
      description: "Badge/chip background, pill labels",
    },
  },
  typeScale: {
    "type.display": {
      fontSize: 46,
      fontWeight: 600,
      description: "Hero headlines, large callouts",
    },
    "type.title": {
      fontSize: 32,
      fontWeight: 600,
      description: "Section titles",
    },
    "type.heading": {
      fontSize: 24,
      fontWeight: 600,
      description: "Card headings, subheadings",
    },
    "type.body": {
      fontSize: 16,
      fontWeight: 600,
      description: "Primary content text, labels",
    },
    "type.caption": {
      fontSize: 12,
      fontWeight: 600,
      description: "Timestamps, secondary labels, badges",
    },
  },
  spacing: {
    "space.xs": { value: 4, description: "Tight inline gaps, icon spacing" },
    "space.sm": { value: 8, description: "Small element gaps" },
    "space.md": { value: 12, description: "Default item spacing" },
    "space.lg": { value: 16, description: "Content section gaps" },
    "space.xl": { value: 32, description: "Major section spacing" },
    "space.2xl": { value: 48, description: "Screen-edge padding" },
    "space.3xl": { value: 64, description: "Large screen-edge padding" },
  },
  radii: {
    "radius.sm": { value: 8, description: "Small chips, badges" },
    "radius.pill": { value: 100, description: "Pill-shaped badges, avatars" },
  },
  shadows: {
    "shadow.card": {
      offsetX: 0,
      offsetY: 2,
      blurRadius: 8,
      color: "#00000033",
      description: "Subtle card elevation on dark backgrounds",
    },
  },
  roles: {
    page: {
      tokens: ["surface.page"],
      description: "Screen-level dark background",
    },
    card: {
      tokens: ["surface.card", "radius.sm"],
      description: "Translucent content card",
    },
    "card.elevated": {
      tokens: ["surface.card", "radius.sm", "shadow.card"],
      description: "Elevated card with subtle shadow",
    },
    badge: {
      tokens: ["surface.overlay", "radius.pill"],
      description: "Pill-shaped badge/label",
    },
    chip: {
      tokens: ["surface.card", "radius.pill"],
      description: "Translucent chip/tag",
    },
    divider: {
      tokens: ["border.default"],
      description: "Horizontal separator",
    },
    display: {
      tokens: ["type.display", "text.secondary"],
      description: "Hero text, large callouts (muted)",
    },
    "display.bold": {
      tokens: ["type.display", "text.primary"],
      description: "Hero text, emphasized words (bright white)",
    },
    title: {
      tokens: ["type.title", "text.secondary"],
      description: "Section heading (muted)",
    },
    "title.bold": {
      tokens: ["type.title", "text.primary"],
      description: "Section heading (bright white)",
    },
    heading: {
      tokens: ["type.heading", "text.primary"],
      description: "Card/content heading",
    },
    body: {
      tokens: ["type.body", "text.primary"],
      description: "Primary body text",
    },
    "body.muted": {
      tokens: ["type.body", "text.secondary"],
      description: "Muted body text",
    },
    caption: {
      tokens: ["type.caption", "text.tertiary"],
      description: "Timestamps, secondary info",
    },
    hint: {
      tokens: ["type.caption", "text.tertiary"],
      description: "Helper text, descriptions",
    },
    label: {
      tokens: ["type.caption", "text.primary"],
      description: "Badge label text",
    },
  },
};
