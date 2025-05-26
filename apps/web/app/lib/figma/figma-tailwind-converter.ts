// Enhanced Figma to Tailwind converter based on MCP implementation
import type { FigmaNode } from "./figma-client";

// Helper functions for color conversion
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) =>
        Math.round(x * 255)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

// Map RGB color to closest Tailwind color
function mapToTailwindColor(hexColor: string, prefix: string = "text"): string {
  const tailwindColors: Record<string, string> = {
    "#000000": `${prefix}-black`,
    "#ffffff": `${prefix}-white`,
    "#ef4444": `${prefix}-red-500`,
    "#dc2626": `${prefix}-red-600`,
    "#b91c1c": `${prefix}-red-700`,
    "#3b82f6": `${prefix}-blue-500`,
    "#2563eb": `${prefix}-blue-600`,
    "#1d4ed8": `${prefix}-blue-700`,
    "#10b981": `${prefix}-green-500`,
    "#059669": `${prefix}-green-600`,
    "#047857": `${prefix}-green-700`,
    "#f59e0b": `${prefix}-yellow-500`,
    "#d97706": `${prefix}-yellow-600`,
    "#b45309": `${prefix}-yellow-700`,
    "#6366f1": `${prefix}-indigo-500`,
    "#4f46e5": `${prefix}-indigo-600`,
    "#4338ca": `${prefix}-indigo-700`,
    "#8b5cf6": `${prefix}-purple-500`,
    "#7c3aed": `${prefix}-purple-600`,
    "#6d28d9": `${prefix}-purple-700`,
    "#ec4899": `${prefix}-pink-500`,
    "#db2777": `${prefix}-pink-600`,
    "#be185d": `${prefix}-pink-700`,
    "#6b7280": `${prefix}-gray-500`,
    "#4b5563": `${prefix}-gray-600`,
    "#374151": `${prefix}-gray-700`,
    "#f3f4f6": `${prefix}-gray-100`,
    "#e5e7eb": `${prefix}-gray-200`,
    "#d1d5db": `${prefix}-gray-300`,
  };

  // Find the closest color by calculating the distance in RGB space
  let minDistance = Number.MAX_VALUE;
  let closestColor = `${prefix}-gray-500`;

  const r1 = parseInt(hexColor.slice(1, 3), 16);
  const g1 = parseInt(hexColor.slice(3, 5), 16);
  const b1 = parseInt(hexColor.slice(5, 7), 16);

  for (const [color, className] of Object.entries(tailwindColors)) {
    const r2 = parseInt(color.slice(1, 3), 16);
    const g2 = parseInt(color.slice(3, 5), 16);
    const b2 = parseInt(color.slice(5, 7), 16);

    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = className;
    }
  }

  return closestColor;
}

// Map font size to Tailwind class
function mapFontSizeToTailwind(fontSize: number): string {
  if (fontSize <= 12) return "text-xs";
  if (fontSize <= 14) return "text-sm";
  if (fontSize <= 16) return "text-base";
  if (fontSize <= 18) return "text-lg";
  if (fontSize <= 20) return "text-xl";
  if (fontSize <= 24) return "text-2xl";
  if (fontSize <= 30) return "text-3xl";
  if (fontSize <= 36) return "text-4xl";
  if (fontSize <= 48) return "text-5xl";
  if (fontSize <= 60) return "text-6xl";
  if (fontSize <= 72) return "text-7xl";
  if (fontSize <= 96) return "text-8xl";
  return "text-9xl";
}

// Map font weight to Tailwind class
function mapFontWeightToTailwind(fontWeight: number): string {
  if (fontWeight <= 100) return "font-thin";
  if (fontWeight <= 200) return "font-extralight";
  if (fontWeight <= 300) return "font-light";
  if (fontWeight <= 400) return "font-normal";
  if (fontWeight <= 500) return "font-medium";
  if (fontWeight <= 600) return "font-semibold";
  if (fontWeight <= 700) return "font-bold";
  if (fontWeight <= 800) return "font-extrabold";
  return "font-black";
}

// Map size values to Tailwind size classes
function mapToTailwindSize(size: number): string {
  if (size <= 4) return "1";
  if (size <= 8) return "2";
  if (size <= 12) return "3";
  if (size <= 16) return "4";
  if (size <= 20) return "5";
  if (size <= 24) return "6";
  if (size <= 28) return "7";
  if (size <= 32) return "8";
  if (size <= 36) return "9";
  if (size <= 40) return "10";
  if (size <= 44) return "11";
  if (size <= 48) return "12";
  if (size <= 56) return "14";
  if (size <= 64) return "16";
  if (size <= 80) return "20";
  if (size <= 96) return "24";
  if (size <= 112) return "28";
  if (size <= 128) return "32";
  if (size <= 144) return "36";
  if (size <= 160) return "40";
  if (size <= 176) return "44";
  if (size <= 192) return "48";
  if (size <= 208) return "52";
  if (size <= 224) return "56";
  if (size <= 240) return "60";
  if (size <= 256) return "64";
  if (size <= 288) return "72";
  if (size <= 320) return "80";
  if (size <= 384) return "96";
  return "full";
}

export function convertFigmaStylesToTailwind(figmaNode: FigmaNode): string[] {
  const tailwindClasses: string[] = [];

  // Convert fills (background colors)
  if (figmaNode.fills && figmaNode.fills.length > 0) {
    const fill = figmaNode.fills[0];
    if (fill && fill.type === "SOLID" && fill.color) {
      const { r, g, b } = fill.color;
      const hexColor = rgbToHex(r, g, b);
      const tailwindColor = mapToTailwindColor(hexColor, "bg");
      tailwindClasses.push(tailwindColor);

      // Add opacity if needed
      if (fill.opacity && fill.opacity < 1) {
        const opacityValue = Math.round(fill.opacity * 100);
        if (opacityValue <= 5) tailwindClasses.push("opacity-5");
        else if (opacityValue <= 10) tailwindClasses.push("opacity-10");
        else if (opacityValue <= 20) tailwindClasses.push("opacity-20");
        else if (opacityValue <= 25) tailwindClasses.push("opacity-25");
        else if (opacityValue <= 30) tailwindClasses.push("opacity-30");
        else if (opacityValue <= 40) tailwindClasses.push("opacity-40");
        else if (opacityValue <= 50) tailwindClasses.push("opacity-50");
        else if (opacityValue <= 60) tailwindClasses.push("opacity-60");
        else if (opacityValue <= 70) tailwindClasses.push("opacity-70");
        else if (opacityValue <= 75) tailwindClasses.push("opacity-75");
        else if (opacityValue <= 80) tailwindClasses.push("opacity-80");
        else if (opacityValue <= 90) tailwindClasses.push("opacity-90");
        else if (opacityValue <= 95) tailwindClasses.push("opacity-95");
      }
    }
  }

  // Convert typography
  if (figmaNode.style) {
    const {
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      textAlignHorizontal,
    } = figmaNode.style;

    // Map font size to Tailwind classes
    if (fontSize) {
      tailwindClasses.push(mapFontSizeToTailwind(fontSize));
    }

    // Map font weight
    if (fontWeight) {
      tailwindClasses.push(mapFontWeightToTailwind(fontWeight));
    }

    // Map line height
    if (lineHeight && typeof lineHeight === "number") {
      if (lineHeight <= 1) tailwindClasses.push("leading-none");
      else if (lineHeight <= 1.125) tailwindClasses.push("leading-tight");
      else if (lineHeight <= 1.25) tailwindClasses.push("leading-snug");
      else if (lineHeight <= 1.375) tailwindClasses.push("leading-normal");
      else if (lineHeight <= 1.5) tailwindClasses.push("leading-relaxed");
      else if (lineHeight <= 1.625) tailwindClasses.push("leading-loose");
      else tailwindClasses.push("leading-loose");
    }

    // Map letter spacing
    if (letterSpacing && typeof letterSpacing === "number") {
      if (letterSpacing <= -0.05) tailwindClasses.push("tracking-tighter");
      else if (letterSpacing <= -0.025) tailwindClasses.push("tracking-tight");
      else if (letterSpacing <= 0.025) tailwindClasses.push("tracking-normal");
      else if (letterSpacing <= 0.05) tailwindClasses.push("tracking-wide");
      else if (letterSpacing <= 0.1) tailwindClasses.push("tracking-wider");
      else tailwindClasses.push("tracking-widest");
    }

    // Map text alignment
    if (textAlignHorizontal) {
      switch (textAlignHorizontal) {
        case "LEFT":
          tailwindClasses.push("text-left");
          break;
        case "CENTER":
          tailwindClasses.push("text-center");
          break;
        case "RIGHT":
          tailwindClasses.push("text-right");
          break;
        case "JUSTIFIED":
          tailwindClasses.push("text-justify");
          break;
      }
    }
  }

  // Convert text color
  if (
    figmaNode.fills &&
    figmaNode.fills.length > 0 &&
    figmaNode.type === "TEXT"
  ) {
    const fill = figmaNode.fills[0];
    if (fill && fill.type === "SOLID" && fill.color) {
      const { r, g, b } = fill.color;
      const hexColor = rgbToHex(r, g, b);
      const tailwindColor = mapToTailwindColor(hexColor, "text");
      tailwindClasses.push(tailwindColor);
    }
  }

  // Convert layout properties
  if (figmaNode.absoluteBoundingBox) {
    const { width, height } = figmaNode.absoluteBoundingBox;

    // Only add specific sizes for reasonable dimensions
    if (width > 0 && width < 1000) {
      tailwindClasses.push(`w-${mapToTailwindSize(width)}`);
    }
    if (height > 0 && height < 1000) {
      tailwindClasses.push(`h-${mapToTailwindSize(height)}`);
    }
  }

  // Convert border radius
  if (figmaNode.cornerRadius) {
    const radius = figmaNode.cornerRadius;
    if (radius <= 2) tailwindClasses.push("rounded-sm");
    else if (radius <= 4) tailwindClasses.push("rounded");
    else if (radius <= 6) tailwindClasses.push("rounded-md");
    else if (radius <= 8) tailwindClasses.push("rounded-lg");
    else if (radius <= 12) tailwindClasses.push("rounded-xl");
    else if (radius <= 16) tailwindClasses.push("rounded-2xl");
    else if (radius <= 24) tailwindClasses.push("rounded-3xl");
    else if (radius >= 999) tailwindClasses.push("rounded-full");
    else tailwindClasses.push("rounded-3xl");
  }

  // Convert borders
  if (figmaNode.strokes && figmaNode.strokes.length > 0) {
    const stroke = figmaNode.strokes[0];
    if (stroke && stroke.type === "SOLID" && stroke.color) {
      const { r, g, b } = stroke.color;
      const hexColor = rgbToHex(r, g, b);
      const tailwindColor = mapToTailwindColor(hexColor, "border");
      tailwindClasses.push(tailwindColor);

      // Border width
      if (figmaNode.strokeWeight) {
        const weight = figmaNode.strokeWeight;
        if (weight <= 1) tailwindClasses.push("border");
        else if (weight <= 2) tailwindClasses.push("border-2");
        else if (weight <= 4) tailwindClasses.push("border-4");
        else if (weight <= 8) tailwindClasses.push("border-8");
        else tailwindClasses.push("border-8");
      } else {
        tailwindClasses.push("border");
      }
    }
  }

  // Convert shadows
  if (figmaNode.effects && figmaNode.effects.length > 0) {
    const shadowEffect = figmaNode.effects.find(
      (effect: any) => effect.type === "DROP_SHADOW" && effect.visible !== false
    );
    if (shadowEffect) {
      const { offset, radius } = shadowEffect;
      if (offset && radius !== undefined) {
        if (offset.x === 0 && offset.y === 1 && radius <= 2) {
          tailwindClasses.push("shadow-sm");
        } else if (Math.abs(offset.y) <= 3 && radius <= 4) {
          tailwindClasses.push("shadow");
        } else if (Math.abs(offset.y) <= 8 && radius <= 10) {
          tailwindClasses.push("shadow-md");
        } else if (Math.abs(offset.y) <= 15 && radius <= 15) {
          tailwindClasses.push("shadow-lg");
        } else if (Math.abs(offset.y) <= 25 && radius <= 25) {
          tailwindClasses.push("shadow-xl");
        } else {
          tailwindClasses.push("shadow-2xl");
        }
      }
    }
  }

  // Convert padding (if layoutMode is present, it's likely an auto-layout frame)
  if (
    figmaNode.paddingLeft ||
    figmaNode.paddingTop ||
    figmaNode.paddingRight ||
    figmaNode.paddingBottom
  ) {
    const {
      paddingLeft = 0,
      paddingTop = 0,
      paddingRight = 0,
      paddingBottom = 0,
    } = figmaNode;

    // Check if all paddings are equal
    if (
      paddingLeft === paddingTop &&
      paddingTop === paddingRight &&
      paddingRight === paddingBottom
    ) {
      tailwindClasses.push(`p-${mapToTailwindSize(paddingLeft)}`);
    } else {
      // Add individual paddings
      if (paddingLeft > 0)
        tailwindClasses.push(`pl-${mapToTailwindSize(paddingLeft)}`);
      if (paddingTop > 0)
        tailwindClasses.push(`pt-${mapToTailwindSize(paddingTop)}`);
      if (paddingRight > 0)
        tailwindClasses.push(`pr-${mapToTailwindSize(paddingRight)}`);
      if (paddingBottom > 0)
        tailwindClasses.push(`pb-${mapToTailwindSize(paddingBottom)}`);
    }
  }

  // Convert flex properties for auto-layout frames
  if (figmaNode.layoutMode) {
    if (figmaNode.layoutMode === "HORIZONTAL") {
      tailwindClasses.push("flex", "flex-row");
    } else if (figmaNode.layoutMode === "VERTICAL") {
      tailwindClasses.push("flex", "flex-col");
    }

    // Add gap if itemSpacing is present
    if (figmaNode.itemSpacing && figmaNode.itemSpacing > 0) {
      tailwindClasses.push(`gap-${mapToTailwindSize(figmaNode.itemSpacing)}`);
    }

    // Add alignment classes
    if (figmaNode.primaryAxisAlignItems) {
      switch (figmaNode.primaryAxisAlignItems) {
        case "MIN":
          tailwindClasses.push(
            figmaNode.layoutMode === "HORIZONTAL"
              ? "justify-start"
              : "items-start"
          );
          break;
        case "CENTER":
          tailwindClasses.push(
            figmaNode.layoutMode === "HORIZONTAL"
              ? "justify-center"
              : "items-center"
          );
          break;
        case "MAX":
          tailwindClasses.push(
            figmaNode.layoutMode === "HORIZONTAL" ? "justify-end" : "items-end"
          );
          break;
        case "SPACE_BETWEEN":
          tailwindClasses.push("justify-between");
          break;
      }
    }

    if (figmaNode.counterAxisAlignItems) {
      switch (figmaNode.counterAxisAlignItems) {
        case "MIN":
          tailwindClasses.push(
            figmaNode.layoutMode === "HORIZONTAL"
              ? "items-start"
              : "justify-start"
          );
          break;
        case "CENTER":
          tailwindClasses.push(
            figmaNode.layoutMode === "HORIZONTAL"
              ? "items-center"
              : "justify-center"
          );
          break;
        case "MAX":
          tailwindClasses.push(
            figmaNode.layoutMode === "HORIZONTAL" ? "items-end" : "justify-end"
          );
          break;
      }
    }
  }

  return tailwindClasses.filter(Boolean); // Remove any empty strings
}
