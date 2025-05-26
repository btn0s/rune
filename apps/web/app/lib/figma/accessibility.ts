import type { FigmaNode } from "./figma-client";

// Determine the likely heading level based on font size and other properties
function determineLikelyHeadingLevel(figmaNode: FigmaNode): number {
  if (!figmaNode.style) return 2; // Default to h2 if no style information

  const { fontSize, fontWeight } = figmaNode.style;

  // Use font size as the primary indicator
  if (fontSize >= 32) return 1;
  if (fontSize >= 24) return 2;
  if (fontSize >= 20) return 3;
  if (fontSize >= 18) return 4;
  if (fontSize >= 16) return 5;
  return 6;
}

// Check if a node is likely a button based on its properties
function isLikelyButton(figmaNode: FigmaNode): boolean {
  // Check name for button-related keywords
  const nameLower = figmaNode.name.toLowerCase();
  if (nameLower.includes("button") || nameLower.includes("btn")) return true;

  // Check for common button styles
  if (figmaNode.cornerRadius && figmaNode.cornerRadius > 0) {
    // Buttons often have rounded corners
    if (figmaNode.fills && figmaNode.fills.length > 0) {
      // Buttons typically have a background fill
      return true;
    }
  }

  return false;
}

// Check if a node is likely an image
function isLikelyImage(figmaNode: FigmaNode): boolean {
  if (figmaNode.type === "IMAGE") return true;

  const nameLower = figmaNode.name.toLowerCase();
  if (
    nameLower.includes("image") ||
    nameLower.includes("img") ||
    nameLower.includes("icon")
  )
    return true;

  // Check for image fills
  if (figmaNode.fills) {
    for (const fill of figmaNode.fills) {
      if (fill.type === "IMAGE") return true;
    }
  }

  return false;
}

// Check if a node is likely an input field
function isLikelyInputField(figmaNode: FigmaNode): boolean {
  const nameLower = figmaNode.name.toLowerCase();
  return (
    nameLower.includes("input") ||
    nameLower.includes("field") ||
    nameLower.includes("text field") ||
    nameLower.includes("form field")
  );
}

// Generate appropriate alt text for an image
function generateAltText(figmaNode: FigmaNode): string {
  // Start with the node name
  let altText = figmaNode.name;

  // Remove common prefixes/suffixes that aren't useful in alt text
  altText = altText.replace(/^(img|image|icon|pic|picture)[-_\s]*/i, "");
  altText = altText.replace(/[-_\s]*(img|image|icon|pic|picture)$/i, "");

  // If the alt text is empty or just contains "image" or similar, use a more generic description
  if (!altText || /^(img|image|icon|pic|picture)$/i.test(altText)) {
    altText = "Image";
  }

  return altText;
}

export function enhanceWithAccessibility(
  jsx: string,
  figmaNode: FigmaNode
): string {
  let enhancedJsx = jsx;

  // Add appropriate ARIA attributes based on component type
  if (
    figmaNode.type === "TEXT" ||
    (figmaNode.characters && figmaNode.characters.length > 0)
  ) {
    // For text elements, check if they might be headings
    if (figmaNode.style && figmaNode.style.fontSize >= 16) {
      const headingLevel = determineLikelyHeadingLevel(figmaNode);
      enhancedJsx = enhancedJsx.replace(
        /<p([^>]*)>(.*?)<\/p>/g,
        `<h${headingLevel}$1>$2</h${headingLevel}>`
      );
    }
  }

  // Add alt text to images
  if (isLikelyImage(figmaNode)) {
    const altText = generateAltText(figmaNode);
    if (enhancedJsx.includes("<img")) {
      enhancedJsx = enhancedJsx.replace(
        /<img([^>]*)>/g,
        `<img$1 alt="${altText}">`
      );
    } else if (enhancedJsx.includes("<Image")) {
      enhancedJsx = enhancedJsx.replace(
        /<Image([^>]*)>/g,
        `<Image$1 alt="${altText}">`
      );
    } else {
      // If it's a div with a background image, add role="img" and aria-label
      enhancedJsx = enhancedJsx.replace(
        /<div([^>]*)>/g,
        `<div$1 role="img" aria-label="${altText}">`
      );
    }
  }

  // Add appropriate role attributes for interactive elements
  if (isLikelyButton(figmaNode)) {
    if (!enhancedJsx.includes("<button")) {
      enhancedJsx = enhancedJsx.replace(
        /<div([^>]*)>/g,
        '<div$1 role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick && onClick(e)}>'
      );

      // If there's an onClick handler, make sure it's keyboard accessible
      enhancedJsx = enhancedJsx.replace(/onClick={([^}]+)}/g, "onClick={$1}");
    }
  }

  // Add label and appropriate attributes for input fields
  if (isLikelyInputField(figmaNode)) {
    const inputId = `input-${figmaNode.id.replace(/[^a-zA-Z0-9]/g, "-")}`;
    const labelText =
      figmaNode.name
        .replace(/input|field|text field|form field/gi, "")
        .trim() || "Input";

    if (enhancedJsx.includes("<input")) {
      enhancedJsx = enhancedJsx.replace(
        /<input([^>]*)>/g,
        `<label htmlFor="${inputId}">${labelText}<input$1 id="${inputId}" aria-label="${labelText}"></label>`
      );
    } else {
      // If it's a div that should be an input, transform it
      enhancedJsx = enhancedJsx.replace(
        /<div([^>]*)>(.*?)<\/div>/g,
        `<label htmlFor="${inputId}">${labelText}<input$1 id="${inputId}" aria-label="${labelText}" /></label>`
      );
    }
  }

  return enhancedJsx;
}
