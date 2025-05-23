import { GraphJSON } from "@rune/behave-graph-core";
import { BehaveNode, BehaveEdge } from "../types";

export function behaveGraphToFlow(graph: GraphJSON): {
  nodes: BehaveNode[];
  edges: BehaveEdge[];
} {
  const nodes: BehaveNode[] = [];
  const edges: BehaveEdge[] = [];

  // Convert nodes
  graph.nodes?.forEach((node, index) => {
    const position =
      node.metadata?.position &&
      typeof node.metadata.position === "object" &&
      "x" in node.metadata.position &&
      "y" in node.metadata.position
        ? {
            x: (node.metadata.position as any).x as number,
            y: (node.metadata.position as any).y as number,
          }
        : { x: index * 200, y: index * 100 };

    const flowNode: BehaveNode = {
      id: node.id,
      type: "behaveNode",
      position,
      data: {
        nodeType: node.type,
        inputs: node.parameters || {},
        outputs: {},
        label: node.label || node.type.split("/").pop() || node.type,
      },
    };
    nodes.push(flowNode);
  });

  // Convert edges (connections between nodes)
  graph.nodes?.forEach((node) => {
    if (node.parameters) {
      Object.entries(node.parameters).forEach(([inputKey, inputValue]) => {
        if (
          inputValue &&
          typeof inputValue === "object" &&
          "link" in inputValue
        ) {
          const link = inputValue.link;
          if (
            link &&
            typeof link === "object" &&
            "nodeId" in link &&
            "socket" in link
          ) {
            const edge: BehaveEdge = {
              id: `${link.nodeId}-${link.socket}-${node.id}-${inputKey}`,
              source: link.nodeId as string,
              target: node.id,
              sourceHandle: link.socket as string,
              targetHandle: inputKey,
            };
            edges.push(edge);
          }
        }
      });
    }
  });

  return { nodes, edges };
}

export function flowToBehaveGraph(
  nodes: BehaveNode[],
  edges: BehaveEdge[]
): GraphJSON {
  const behaveNodes = nodes.map((node) => {
    const parameters: Record<string, any> = { ...node.data.inputs };

    // Add connections from edges
    edges
      .filter((edge) => edge.target === node.id)
      .forEach((edge) => {
        parameters[edge.targetHandle || ""] = {
          link: {
            nodeId: edge.source,
            socket: edge.sourceHandle,
          },
        };
      });

    return {
      id: node.id,
      type: node.data.nodeType,
      label: node.data.label,
      parameters,
      metadata: {
        position: JSON.stringify(node.position),
      },
    };
  });

  return {
    nodes: behaveNodes,
  };
}
