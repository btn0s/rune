import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { NodeSpecJSON } from "@rune/behave-graph-core";
import { getValueTypeColors } from "~/lib/flow/util/colors";
import { cn } from "~/lib/utils";

interface ColoredEdgeProps extends EdgeProps {
  data?: {
    specJson?: NodeSpecJSON[];
  };
}

export default function ColoredEdge(props: ColoredEdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    source,
    sourceHandleId,
    selected,
    data,
  } = props;
  const { getNode } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine the value type from the source handle
  const sourceNode = getNode(source);
  const specJson = data?.specJson;

  let valueType: string | undefined;
  let isExecConnection = false;

  if (sourceNode && sourceHandleId && specJson) {
    // Find the node spec for the source node
    const nodeSpec = specJson.find((spec) => spec.type === sourceNode.type);

    if (nodeSpec) {
      // Check if this is an execution connection (flow)
      isExecConnection = sourceHandleId.includes("flow");

      if (isExecConnection) {
        valueType = "flow";
      } else {
        // Find the output socket spec to get its value type
        const outputSocket = nodeSpec.outputs.find(
          (output) => output.name === sourceHandleId
        );
        valueType = outputSocket?.valueType;
      }
    }
  }

  // Get colors for the value type
  const typeColors = getValueTypeColors(valueType || "flow", "default");

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        className={cn("!stroke-[2px]", typeColors?.stroke, {
          "!stroke-[4px] brightness-110": selected,
        })}
        style={{
          ...style,
        }}
      />
    </>
  );
}
