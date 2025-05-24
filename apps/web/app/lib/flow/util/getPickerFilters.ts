import type { NodeSpecJSON } from "@rune/behave-graph-core";
import { type Node, type OnConnectStartParams } from "@xyflow/react";

import type { NodePickerFilters } from "~/components/flow/NodePicker";
import { getSocketsByNodeTypeAndHandleType } from "./getSocketsByNodeTypeAndHandleType";

export const getNodePickerFilters = (
  nodes: Node[],
  params: OnConnectStartParams | undefined,
  specJSON: NodeSpecJSON[] | undefined
): NodePickerFilters | undefined => {
  if (params === undefined) return;

  const originNode = nodes.find((node) => node.id === params.nodeId);
  if (originNode === undefined) return;

  const sockets = specJSON
    ? getSocketsByNodeTypeAndHandleType(
        specJSON,
        originNode.type,
        params.handleType
      )
    : undefined;

  const socket = sockets?.find((socket) => socket.name === params.handleId);

  if (socket === undefined) return;

  return {
    handleType: params.handleType === "source" ? "target" : "source",
    valueType: socket.valueType,
  };
};
