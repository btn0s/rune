import type { GraphJSON, NodeSpecJSON } from "@rune/behave-graph-core";
import { useCallback, useEffect, useState } from "react";
import {
  useEdgesState,
  useNodesState,
  type Node,
  type Edge,
} from "@xyflow/react";

import { behaveToFlow } from "~/lib/flow/transformers/behaveToFlow";
import { flowToBehave } from "~/lib/flow/transformers/flowToBehave";
import { autoLayout } from "~/lib/flow/util/autoLayout";
import { hasPositionMetaData } from "~/lib/flow/util/hasPositionMetaData";
import { useCustomNodeTypes } from "./useCustomNodeTypes";

export const fetchBehaviorGraphJson = async (url: string) =>
  // eslint-disable-next-line unicorn/no-await-expression-member
  (await (await fetch(url)).json()) as GraphJSON;

/**
 * Hook that returns the nodes and edges for react-flow, and the graphJson for the behave-graph.
 * If nodes or edges are changes, the graph json is updated automatically.
 * The graph json can be set manually, in which case the nodes and edges are updated to match the graph json.
 * @param param0
 * @returns
 */
export const useBehaveGraphFlow = ({
  initialGraphJson,
  specJson,
}: {
  initialGraphJson: GraphJSON;
  specJson: NodeSpecJSON[] | undefined;
}) => {
  const [graphJson, setStoredGraphJson] = useState<GraphJSON | undefined>();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const setGraphJson = useCallback(
    (graphJson: GraphJSON) => {
      if (!graphJson) return;

      const [nodes, edges] = behaveToFlow(graphJson);

      if (hasPositionMetaData(graphJson) === false) {
        autoLayout(nodes, edges);
      }

      // Inject specJson into edge data for ColoredEdge component
      const edgesWithSpecJson = edges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          specJson,
        },
      }));

      setNodes(nodes);
      setEdges(edgesWithSpecJson);
      setStoredGraphJson(graphJson);
    },
    [setEdges, setNodes, specJson]
  );

  // Update edges with specJson when specJson changes
  useEffect(() => {
    if (!specJson) return;
    setEdges((currentEdges) =>
      currentEdges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          specJson,
        },
      }))
    );
  }, [specJson, setEdges]);

  useEffect(() => {
    if (!initialGraphJson) return;
    setGraphJson(initialGraphJson);
  }, [initialGraphJson, setGraphJson]);

  useEffect(() => {
    if (!specJson) return;
    // when nodes and edges are updated, update the graph json with the flow to behave behavior
    const graphJson = flowToBehave(nodes, edges, specJson);
    setStoredGraphJson(graphJson);
  }, [nodes, edges, specJson]);

  const nodeTypes = useCustomNodeTypes({
    specJson,
  });

  return {
    nodes,
    edges,
    onEdgesChange,
    onNodesChange,
    setGraphJson,
    graphJson,
    nodeTypes,
  };
};
