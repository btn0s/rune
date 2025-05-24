import { NodeCategory, type NodeSpecJSON } from "@rune/behave-graph-core";
import cx from "classnames";
import React, { type PropsWithChildren } from "react";

import { getCategoryColors } from "~/lib/flow/util/colors";
import { getNodeCategoryIcon } from "~/lib/flow/util/nodeIcons";

type NodeProps = {
  title: string;
  category?: NodeSpecJSON["category"];
  selected: boolean;
};

const NodeContainer: React.FC<PropsWithChildren<NodeProps>> = ({
  title,
  category = NodeCategory.None,
  selected,
  children,
}) => {
  const defaultColors = getCategoryColors(category, "default");
  const mutedColors = getCategoryColors(category, "muted");

  return (
    <div
      className={cx(
        "rounded-md text-sm backdrop-blur bg-foreground/5 min-w-[200px] shadow-lg border hover:shadow-md transition-shadow",
        selected
          ? "ring-2 ring-pink-100 ring-offset-2 ring-offset-background"
          : ""
      )}
    >
      {/* Modern Header with Icon */}
      <div
        className={cx(
          "flex items-center gap-1 px-3 py-2 border-b rounded-t-md"
        )}
      >
        <div
          className={cx(
            "size-4 rounded-full p-0.5 flex items-center justify-center",
            mutedColors.background,
            defaultColors.text
          )}
        >
          {getNodeCategoryIcon(category)}
        </div>
        <h3 className="text-xs font-medium flex-1 select-none leading-none">
          {title}
        </h3>
      </div>

      {/* Content Area */}
      <div className="p-3">{children}</div>
    </div>
  );
};

export default NodeContainer;
