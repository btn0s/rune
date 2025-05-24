import type { NodeSpecJSON } from "@rune/behave-graph-core";
import { useEffect, useState } from "react";
import type { NodeTypes } from "@xyflow/react";

import { Node } from "~/components/flow";

const getCustomNodeTypes = (allSpecs: NodeSpecJSON[]) => {
  return allSpecs.reduce((nodes: NodeTypes, node) => {
    nodes[node.type] = (props) => (
      <Node spec={node} allSpecs={allSpecs} {...props} />
    );
    return nodes;
  }, {});
};

export const useCustomNodeTypes = ({
  specJson,
}: {
  specJson: NodeSpecJSON[] | undefined;
}) => {
  const [customNodeTypes, setCustomNodeTypes] = useState<NodeTypes>();
  useEffect(() => {
    if (!specJson) return;
    const customNodeTypes = getCustomNodeTypes(specJson);

    setCustomNodeTypes(customNodeTypes);
  }, [specJson]);

  return customNodeTypes;
};
