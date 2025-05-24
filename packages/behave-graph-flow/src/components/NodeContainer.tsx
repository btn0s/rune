import { NodeCategory, NodeSpecJSON } from '@rune/behave-graph-core';
import cx from 'classnames';
import React, { PropsWithChildren } from 'react';

import { getCategoryColors } from "../util/colors.js";
import { getNodeCategoryIcon } from "../util/nodeIcons.js";

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
  const borderColor = selected ? mutedColors.border : defaultColors.border;

  return (
    <div
      className={cx(
        "rounded-md text-sm bg-foreground/5 backdrop-blur min-w-[200px] shadow-lg border hover:shadow-md transition-shadow",
        borderColor
      )}
    >
      {/* Modern Header with Icon */}
      <div
        className={cx(
          "flex items-center gap-2 px-3 py-2 border-b rounded-t-md",
          borderColor
        )}
      >
        <span className="">{getNodeCategoryIcon(category)}</span>
        <h3 className="text-xs font-medium flex-1 select-none">{title}</h3>
      </div>

      {/* Content Area */}
      <div className="p-3">{children}</div>
    </div>
  );
};

export default NodeContainer;
