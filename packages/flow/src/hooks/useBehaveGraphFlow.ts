import { useCallback, useEffect, useState } from "react";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
} from "@xyflow/react";
import { GraphJSON, IRegistry } from "@rune/behave-graph-core";
import { BehaveNode, BehaveEdge } from "../types";
import { behaveGraphToFlow, flowToBehaveGraph } from "../utils/graphTransforms";

export function useBehaveGraphFlow(
  initialGraph: GraphJSON,
  registry: IRegistry,
  onGraphChange?: (graph: GraphJSON) => void
) {
  const [nodes, setNodes, onNodesChange] = useNodesState<BehaveNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<BehaveEdge>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize nodes and edges from the initial graph only once
  useEffect(() => {
    if (!isInitialized) {
      const { nodes: flowNodes, edges: flowEdges } =
        behaveGraphToFlow(initialGraph);
      setNodes(flowNodes);
      setEdges(flowEdges);
      setIsInitialized(true);
    }
  }, [initialGraph, isInitialized, setNodes, setEdges]);

  // Convert flow state back to behave graph when nodes or edges change (but not during initialization)
  const handleGraphUpdate = useCallback(() => {
    if (isInitialized && onGraphChange) {
      const behaveGraph = flowToBehaveGraph(nodes, edges);
      onGraphChange(behaveGraph);
    }
  }, [nodes, edges, isInitialized, onGraphChange]);

  // Debounce the graph updates to avoid excessive calls
  useEffect(() => {
    if (isInitialized) {
      const timeoutId = setTimeout(handleGraphUpdate, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [handleGraphUpdate, isInitialized]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge: BehaveEdge = {
        ...params,
        id: `${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}`,
        sourceHandle: params.sourceHandle || "",
        targetHandle: params.targetHandle || "",
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (nodeType: string, position: { x: number; y: number }) => {
      const nodeSpec = registry.nodes[nodeType];
      if (!nodeSpec) return;

      const newNode: BehaveNode = {
        id: `node-${Date.now()}`,
        type: "behaveNode",
        position,
        data: {
          nodeType,
          inputs: {},
          outputs: {},
          label: nodeType.split("/").pop() || nodeType,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [registry.nodes, setNodes]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    isReady: isInitialized,
  };
}
