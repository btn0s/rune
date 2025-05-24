import type { GraphJSON, IRegistry } from "@rune/behave-graph-core";
import React from "react";
import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";

import { useBehaveGraphFlow } from "~/hooks/useBehaveGraphFlow";
import { useFlowHandlers } from "~/hooks/useFlowHandlers";
import { useGraphRunner } from "~/hooks/useGraphRunner";
import { useNodeSpecJson } from "~/hooks/useNodeSpecJson";
import CustomControls from "./Controls";
import type { Examples } from "./modals/LoadModal";
import { NodePicker } from "./NodePicker";

type FlowProps = {
  initialGraph: GraphJSON;
  registry: IRegistry;
  examples: Examples;
};

export const Flow: React.FC<FlowProps> = ({
  initialGraph: graph,
  registry,
  examples,
}) => {
  const specJson = useNodeSpecJson(registry);

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

  return (
    <ReactFlow
      nodeTypes={nodeTypes}
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
        playing={playing}
        togglePlay={togglePlay}
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
};
