import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react";
import { FlowProps } from "../types";
import { BehaveNode } from "./BehaveNode";
import { NodePicker } from "./NodePicker";
import { useBehaveGraphFlow } from "../hooks/useBehaveGraphFlow";

const nodeTypes = {
  behaveNode: BehaveNode,
};

export function BehaveGraphFlow({
  initialGraph,
  registry,
  onGraphChange,
  className = "",
  style,
}: FlowProps) {
  const [nodePickerState, setNodePickerState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } =
    useBehaveGraphFlow(initialGraph, registry, onGraphChange);

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();

      // Get the position relative to the viewport
      const clientX = "clientX" in event ? event.clientX : 0;
      const clientY = "clientY" in event ? event.clientY : 0;

      setNodePickerState({
        isOpen: true,
        position: { x: clientX, y: clientY },
      });
    },
    []
  );

  const handleCloseNodePicker = useCallback(() => {
    setNodePickerState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleSelectNode = useCallback(
    (nodeType: string, _position: { x: number; y: number }) => {
      // Use a default position for now - in a real implementation,
      // we'd convert the click position to flow coordinates
      const flowPosition = {
        x: Math.random() * 400,
        y: Math.random() * 300,
      };
      addNode(nodeType, flowPosition);
      setNodePickerState((prev) => ({ ...prev, isOpen: false }));
    },
    [addNode]
  );

  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneContextMenu={handlePaneContextMenu}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>

        <NodePicker
          isOpen={nodePickerState.isOpen}
          position={nodePickerState.position}
          onClose={handleCloseNodePicker}
          onSelectNode={handleSelectNode}
          registry={registry}
        />

        {/* Help Text */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs text-gray-600">
          Right-click to add nodes
        </div>
      </ReactFlowProvider>
    </div>
  );
}
