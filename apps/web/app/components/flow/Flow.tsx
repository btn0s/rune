import type { GraphJSON, IRegistry } from "@rune/behave-graph-core";
import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";

import { useBehaveGraphFlow } from "~/hooks/useBehaveGraphFlow";
import { useFlowHandlers } from "~/hooks/useFlowHandlers";
import { useGraphRunner } from "~/hooks/useGraphRunner";
import { useNodeSpecJson } from "~/hooks/useNodeSpecJson";
import CustomControls from "./Controls";
import type { Examples } from "./modals/LoadModal";
import { NodePicker } from "./NodePicker";
import ColoredEdge from "./ColoredEdge";

type FlowProps = {
  initialGraph: GraphJSON;
  registry: IRegistry;
  examples: Examples;
  onGraphChange?: (graph: GraphJSON) => void;
};

export interface FlowRef {
  togglePlay: () => void;
  playing: boolean;
}

export const Flow = forwardRef<FlowRef, FlowProps>(
  ({ initialGraph: graph, registry, examples, onGraphChange }, ref) => {
    const specJson = useNodeSpecJson(registry);
    const isInitialLoad = useRef(true);
    const lastGraphRef = useRef<GraphJSON | null>(null);

    const {
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      graphJson,
      setGraphJson,
      nodeTypes,
    } = useBehaveGraphFlow({
      initialGraphJson: graph,
      specJson,
    });

    const {
      onConnect,
      handleStartConnect,
      handleStopConnect,
      handlePaneClick,
      handlePaneContextMenu,
      nodePickerVisibility,
      handleAddNode,
      lastConnectStart,
      closeNodePicker,
      nodePickFilters,
    } = useFlowHandlers({
      nodes,
      onEdgesChange,
      onNodesChange,
      specJSON: specJson,
    });

    const { togglePlay, playing } = useGraphRunner({
      graphJson,
      registry,
    });

    // Expose togglePlay function to parent component
    useImperativeHandle(
      ref,
      () => ({
        togglePlay,
        playing,
      }),
      [togglePlay, playing]
    );

    // Notify parent component when graph changes (but not on initial load)
    useEffect(() => {
      if (!onGraphChange || !graphJson) return;

      // Skip the initial load
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        lastGraphRef.current = graphJson;
        return;
      }

      // Only call onGraphChange if the graph actually changed
      if (JSON.stringify(graphJson) !== JSON.stringify(lastGraphRef.current)) {
        lastGraphRef.current = graphJson;
        onGraphChange(graphJson);
      }
    }, [graphJson, onGraphChange]);

    // Reset initial load flag when initialGraph prop changes
    useEffect(() => {
      isInitialLoad.current = true;
    }, [graph]);

    // Define edge types
    const edgeTypes = {
      default: ColoredEdge,
    };

    return (
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={handleStartConnect}
        onConnectEnd={handleStopConnect}
        fitViewOptions={{ maxZoom: 1 }}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        colorMode="dark"
      >
        <CustomControls
          setBehaviorGraph={setGraphJson}
          examples={examples}
          specJson={specJson}
        />

        {nodePickerVisibility && (
          <NodePicker
            position={nodePickerVisibility}
            filters={nodePickFilters}
            onPickNode={handleAddNode}
            onClose={closeNodePicker}
            specJSON={specJson}
          />
        )}
      </ReactFlow>
    );
  }
);
