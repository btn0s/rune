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
  };
  dark: {
    background: string;
    text: string;
    border: string;
  };
  light: {
    background: string;
    text: string;
    border: string;
  };
  muted: {
    background: string;
    text: string;
    border: string;
  };
}

export const colors: Record<ColorName, ColorTheme> = {
  red: {
    default: {
      background: "bg-red-500",
      text: "text-red-50",
      border: "border-red-500",
    },
    dark: {
      background: "bg-red-600",
      text: "text-red-50",
      border: "border-red-600",
    },
    light: {
      background: "bg-red-100",
      text: "text-red-900",
      border: "border-red-200",
    },
    muted: {
      background: "bg-red-50",
      text: "text-red-700",
      border: "border-red-100",
    },
  },
  green: {
    default: {
      background: "bg-green-500",
      text: "text-green-50",
      border: "border-green-500",
    },
    dark: {
      background: "bg-green-600",
      text: "text-green-50",
      border: "border-green-600",
    },
    light: {
      background: "bg-green-100",
      text: "text-green-900",
      border: "border-green-200",
    },
    muted: {
      background: "bg-green-50",
      text: "text-green-700",
      border: "border-green-100",
    },
  },
  lime: {
    default: {
      background: "bg-lime-500",
      text: "text-lime-950",
      border: "border-lime-500",
    },
    dark: {
      background: "bg-lime-600",
      text: "text-lime-950",
      border: "border-lime-600",
    },
    light: {
      background: "bg-lime-100",
      text: "text-lime-900",
      border: "border-lime-200",
    },
    muted: {
      background: "bg-lime-50",
      text: "text-lime-700",
      border: "border-lime-100",
    },
  },
  purple: {
    default: {
      background: "bg-purple-500",
      text: "text-purple-50",
      border: "border-purple-500",
    },
    dark: {
      background: "bg-purple-600",
      text: "text-purple-50",
      border: "border-purple-600",
    },
    light: {
      background: "bg-purple-100",
      text: "text-purple-900",
      border: "border-purple-200",
    },
    muted: {
      background: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-100",
    },
  },
  blue: {
    default: {
      background: "bg-blue-500",
      text: "text-blue-50",
      border: "border-blue-500",
    },
    dark: {
      background: "bg-blue-600",
      text: "text-blue-50",
      border: "border-blue-600",
    },
    light: {
      background: "bg-blue-100",
      text: "text-blue-900",
      border: "border-blue-200",
    },
    muted: {
      background: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
    },
  },
  gray: {
    default: {
      background: "bg-gray-500",
      text: "text-gray-50",
      border: "border-gray-500",
    },
    dark: {
      background: "bg-gray-600",
      text: "text-gray-50",
      border: "border-gray-600",
    },
    light: {
      background: "bg-gray-100",
      text: "text-gray-900",
      border: "border-gray-200",
    },
    muted: {
      background: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-100",
    },
  },
  white: {
    default: {
      background: "bg-white",
      text: "text-gray-900",
      border: "border-gray-200",
    },
    dark: {
      background: "bg-gray-900",
      text: "text-gray-50",
      border: "border-gray-800",
    },
    light: {
      background: "bg-gray-50",
      text: "text-gray-800",
      border: "border-gray-100",
    },
    muted: {
      background: "bg-gray-25",
      text: "text-gray-600",
      border: "border-gray-50",
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
