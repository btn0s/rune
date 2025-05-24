import type { NodeSpecJSON } from '@rune/behave-graph-core';

export type ColorName =
  | "red"
  | "green"
  | "lime"
  | "purple"
  | "blue"
  | "gray"
  | "white";

export interface ColorTheme {
  // Following shadcn's background/foreground convention
  default: {
    background: string;
    text: string;
    border: string;
    stroke: string;
  };
  dark: {
    background: string;
    text: string;
    border: string;
    stroke: string;
  };
  light: {
    background: string;
    text: string;
    border: string;
    stroke: string;
  };
  muted: {
    background: string;
    text: string;
    border: string;
    stroke: string;
  };
}

export const colors: Record<ColorName, ColorTheme> = {
  red: {
    default: {
      background: "bg-red-500",
      text: "text-red-500",
      border: "border-red-500",
      stroke: "!stroke-red-500",
    },
    dark: {
      background: "bg-red-700",
      text: "text-red-700",
      border: "border-red-700",
      stroke: "!stroke-red-700",
    },
    light: {
      background: "bg-red-100",
      text: "text-red-100",
      border: "border-red-100",
      stroke: "!stroke-red-100",
    },
    muted: {
      background: "bg-red-200",
      text: "text-red-200",
      border: "border-red-200",
      stroke: "!stroke-red-200",
    },
  },
  green: {
    default: {
      background: "bg-green-500",
      text: "text-green-500",
      border: "border-green-500",
      stroke: "!stroke-green-500",
    },
    dark: {
      background: "bg-green-600",
      text: "text-green-600",
      border: "border-green-600",
      stroke: "!stroke-green-600",
    },
    light: {
      background: "bg-green-100",
      text: "text-green-100",
      border: "border-green-100",
      stroke: "!stroke-green-100",
    },
    muted: {
      background: "bg-green-200",
      text: "text-green-200",
      border: "border-green-200",
      stroke: "!stroke-green-200",
    },
  },
  lime: {
    default: {
      background: "bg-lime-500",
      text: "text-lime-500",
      border: "border-lime-500",
      stroke: "!stroke-lime-500",
    },
    dark: {
      background: "bg-lime-600",
      text: "text-lime-600",
      border: "border-lime-600",
      stroke: "!stroke-lime-600",
    },
    light: {
      background: "bg-lime-100",
      text: "text-lime-100",
      border: "border-lime-100",
      stroke: "!stroke-lime-100",
    },
    muted: {
      background: "bg-lime-200",
      text: "text-lime-200",
      border: "border-lime-200",
      stroke: "!stroke-lime-200",
    },
  },
  purple: {
    default: {
      background: "bg-purple-500",
      text: "text-purple-500",
      border: "border-purple-500",
      stroke: "!stroke-purple-500",
    },
    dark: {
      background: "bg-purple-600",
      text: "text-purple-600",
      border: "border-purple-600",
      stroke: "!stroke-purple-600",
    },
    light: {
      background: "bg-purple-100",
      text: "text-purple-100",
      border: "border-purple-100",
      stroke: "!stroke-purple-100",
    },
    muted: {
      background: "bg-purple-200",
      text: "text-purple-200",
      border: "border-purple-200",
      stroke: "!stroke-purple-200",
    },
  },
  blue: {
    default: {
      background: "bg-blue-500",
      text: "text-blue-500",
      border: "border-blue-500",
      stroke: "!stroke-blue-500",
    },
    dark: {
      background: "bg-blue-600",
      text: "text-blue-600",
      border: "border-blue-600",
      stroke: "!stroke-blue-600",
    },
    light: {
      background: "bg-blue-100",
      text: "text-blue-100",
      border: "border-blue-100",
      stroke: "!stroke-blue-100",
    },
    muted: {
      background: "bg-blue-200",
      text: "text-blue-200",
      border: "border-blue-200",
      stroke: "!stroke-blue-200",
    },
  },
  gray: {
    default: {
      background: "bg-gray-500",
      text: "text-gray-500",
      border: "border-gray-500",
      stroke: "!stroke-gray-500",
    },
    dark: {
      background: "bg-gray-600",
      text: "text-gray-600",
      border: "border-gray-600",
      stroke: "!stroke-gray-600",
    },
    light: {
      background: "bg-gray-100",
      text: "text-gray-100",
      border: "border-gray-100",
      stroke: "!stroke-gray-100",
    },
    muted: {
      background: "bg-gray-200",
      text: "text-gray-200",
      border: "border-gray-200",
      stroke: "!stroke-gray-200",
    },
  },
  white: {
    default: {
      background: "bg-white",
      text: "text-white",
      border: "border-white",
      stroke: "!stroke-white",
    },
    dark: {
      background: "bg-neutral-700",
      text: "text-neutral-700",
      border: "border-neutral-700",
      stroke: "!stroke-neutral-700",
    },
    light: {
      background: "bg-neutral-100",
      text: "text-neutral-100",
      border: "border-neutral-100",
      stroke: "!stroke-neutral-100",
    },
    muted: {
      background: "bg-neutral-200",
      text: "text-neutral-200",
      border: "border-neutral-200",
      stroke: "!stroke-neutral-200",
    },
  },
};

export const valueTypeColorMap: Record<string, ColorName> = {
  flow: "white",
  number: "green",
  float: "green",
  integer: "lime",
  boolean: "red",
  string: "purple",
};

export const categoryColorMap: Record<NodeSpecJSON["category"], ColorName> = {
  Event: "red",
  Logic: "green",
  Variable: "purple",
  Query: "purple",
  Action: "blue",
  Flow: "gray",
  Effect: "lime",
  Time: "gray",
  None: "gray",
};

// Utility functions for easier color access
export const getColors = (
  colorName: ColorName,
  variant: keyof ColorTheme = "default"
) => {
  const colorTheme = colors[colorName] || colors.gray;
  return colorTheme[variant];
};

export const getValueTypeColors = (
  valueType: string,
  variant: keyof ColorTheme = "default"
) => {
  const colorName = valueTypeColorMap[valueType] || "gray";
  return getColors(colorName, variant);
};

export const getCategoryColors = (
  category: NodeSpecJSON["category"],
  variant: keyof ColorTheme = "default"
) => {
  const colorName = categoryColorMap[category] || "gray";
  return getColors(colorName, variant);
};

// Legacy support - keeping the old array format for backward compatibility
// @deprecated Use colors[colorName] instead for better semantic clarity
export const colorThemes: Record<ColorName, ColorTheme> = colors;

// @deprecated Use colors[colorName] instead
export const getColorTheme_DEPRECATED = getColors;
export const getValueTypeColorTheme = getValueTypeColors;
export const getCategoryColorTheme = getCategoryColors;
