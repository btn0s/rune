/**
 * Color parsing utility for converting hex strings and RGBA objects
 * into normalized RGBA format for the Figma Plugin API.
 *
 * Figma colors use 0-1 range for r, g, b, a.
 */

import type { RGBA } from "./types";

/**
 * Parse a color input into a normalized RGBA object (0-1 range).
 *
 * Accepted inputs:
 * - Hex strings: "#RGB", "#RGBA", "#RRGGBB", "#RRGGBBAA"
 * - RGBA objects: { r: 0-1, g: 0-1, b: 0-1, a?: 0-1 }
 *
 * @returns RGBA with r, g, b in 0-1 range, a defaults to 1
 */
export function parseColor(input: string | RGBA): RGBA {
  if (typeof input === "string") {
    return parseHexColor(input);
  }

  // RGBA object — validate and normalize
  if (
    typeof input === "object" &&
    input !== null &&
    typeof input.r === "number" &&
    typeof input.g === "number" &&
    typeof input.b === "number"
  ) {
    return {
      r: clamp01(input.r),
      g: clamp01(input.g),
      b: clamp01(input.b),
      a: input.a !== undefined ? clamp01(input.a) : 1,
    };
  }

  throw new Error(
    `Invalid color input: expected hex string or {r, g, b, a?} object`,
  );
}

function parseHexColor(hex: string): RGBA {
  let h = hex.startsWith("#") ? hex.slice(1) : hex;

  switch (h.length) {
    case 3:
      // #RGB → #RRGGBB
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      break;
    case 4:
      // #RGBA → #RRGGBBAA
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
      break;
    case 6:
      // #RRGGBB — already correct
      break;
    case 8:
      // #RRGGBBAA — already correct
      break;
    default:
      throw new Error(
        `Invalid hex color "${hex}": expected 3, 4, 6, or 8 hex digits`,
      );
  }

  const num = parseInt(h, 16);
  if (isNaN(num)) {
    throw new Error(`Invalid hex color "${hex}": contains non-hex characters`);
  }

  if (h.length === 8) {
    return {
      r: ((num >>> 24) & 0xff) / 255,
      g: ((num >>> 16) & 0xff) / 255,
      b: ((num >>> 8) & 0xff) / 255,
      a: (num & 0xff) / 255,
    };
  }

  return {
    r: ((num >>> 16) & 0xff) / 255,
    g: ((num >>> 8) & 0xff) / 255,
    b: (num & 0xff) / 255,
    a: 1,
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
