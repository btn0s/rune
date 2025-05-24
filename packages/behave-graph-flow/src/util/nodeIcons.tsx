import React from "react";
import {
  Calculator,
  Leaf,
  Zap,
  HelpCircle,
  Database,
  GitBranch,
  Play,
  Clock,
  Settings,
} from "lucide-react";
import { NodeSpecJSON } from "@rune/behave-graph-core";

export const getNodeCategoryIcon = (category?: NodeSpecJSON["category"]) => {
  const iconProps = { className: "h-4 w-4" };

  switch (category) {
    case "Logic":
      return <Calculator {...iconProps} />;
    case "Event":
      return <Zap {...iconProps} />;
    case "Variable":
    case "Query":
      return <Database {...iconProps} />;
    case "Flow":
      return <GitBranch {...iconProps} />;
    case "Action":
      return <Play {...iconProps} />;
    case "Time":
      return <Clock {...iconProps} />;
    case "Effect":
      return <Leaf {...iconProps} />;
    case "None":
    default:
      return <HelpCircle {...iconProps} />;
  }
};
