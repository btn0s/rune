import type { NodeSpecJSON } from "@rune/behave-graph-core";
import React, { useState } from "react";
import { useReactFlow, type XYPosition } from "@xyflow/react";

import { useOnPressKey } from "~/hooks/useOnPressKey";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";

export type NodePickerFilters = {
  handleType: "source" | "target";
  valueType: string;
};

type NodePickerProps = {
  position: XYPosition;
  filters?: NodePickerFilters;
  onPickNode: (type: string, position: XYPosition) => void;
  onClose: () => void;
  specJSON: NodeSpecJSON[] | undefined;
};

export const NodePicker: React.FC<NodePickerProps> = ({
  position,
  onPickNode,
  onClose,
  filters,
  specJSON,
}: NodePickerProps) => {
  const [search, setSearch] = useState("");
  const instance = useReactFlow();

  useOnPressKey("Escape", onClose);

  if (!specJSON) return null;
  
  let filtered = specJSON;
  if (filters !== undefined) {
    filtered = filtered?.filter((node) => {
      const sockets =
        filters?.handleType === "source" ? node.outputs : node.inputs;
      return sockets.some((socket) => socket.valueType === filters?.valueType);
    });
  }

  // Group nodes by category for better organization
  const groupedNodes = filtered.reduce(
    (acc, node) => {
      const category = node.type.split("/")[0] || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(node);
      return acc;
    },
    {} as Record<string, NodeSpecJSON[]>
  );

  return (
    <div
      className="node-picker absolute z-50 w-80 bg-popover text-popover-foreground border rounded-md shadow-lg"
      style={{ top: position.y, left: position.x }}
    >
      <Command
        filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1;
          return 0;
        }}
      >
        <div className="border-b px-3 py-2">
          <h3 className="text-sm font-medium">Add Node</h3>
        </div>
        <CommandInput
          placeholder="Search nodes..."
          value={search}
          onValueChange={setSearch}
          autoFocus
        />
        <CommandList className="max-h-64">
          <CommandEmpty>No nodes found.</CommandEmpty>
          {Object.entries(groupedNodes).map(([category, nodes]) => (
            <CommandGroup key={category} heading={category}>
              {nodes.map(({ type }) => (
                <CommandItem
                  key={type}
                  value={type}
                  onSelect={() => {
                    onPickNode(type, instance.screenToFlowPosition(position));
                    onClose();
                  }}
                  className="cursor-pointer"
                >
                  <span className="truncate">
                    {type.split("/").pop() || type}
                  </span>
                  {type.includes("/") && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {type.split("/").slice(0, -1).join("/")}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </div>
  );
};
