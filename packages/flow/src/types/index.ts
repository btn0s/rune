import { Node, Edge } from "@xyflow/react";
import { GraphJSON, IRegistry } from "@rune/behave-graph-core";

export interface BehaveNodeData extends Record<string, unknown> {
  nodeType: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  label?: string;
}

export type BehaveNode = Node<BehaveNodeData>;
export type BehaveEdge = Edge;

export interface FlowProps {
  initialGraph: GraphJSON;
  registry: IRegistry;
  onGraphChange?: (graph: GraphJSON) => void;
  className?: string;
  style?: import("react").CSSProperties;
}

export interface NodePickerProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onSelectNode: (nodeType: string, position: { x: number; y: number }) => void;
  registry: IRegistry;
}
