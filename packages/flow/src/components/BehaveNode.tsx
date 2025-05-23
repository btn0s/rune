import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { BehaveNode as BehaveNodeType } from "../types";
import classNames from "classnames";

export function BehaveNode({ data, selected }: NodeProps<BehaveNodeType>) {
  const { nodeType, label, inputs, outputs } = data;

  // Get input and output socket names (simplified for now)
  const inputSockets = Object.keys(inputs || {});
  const outputSockets = ["result"]; // Simplified - in a real implementation, this would come from the node spec

  return (
    <div
      className={classNames(
        "bg-white border-2 rounded-lg shadow-md min-w-[150px]",
        {
          "border-blue-500": selected,
          "border-gray-300": !selected,
        }
      )}
    >
      {/* Input handles */}
      {inputSockets.map((socket, index) => (
        <Handle
          key={`input-${socket}`}
          type="target"
          position={Position.Left}
          id={socket}
        />
      ))}

      {/* Node header */}
      <div className="bg-gray-100 px-3 py-2 rounded-t-lg border-b">
        <div className="text-sm font-medium text-gray-900 truncate">
          {label || nodeType}
        </div>
        <div className="text-xs text-gray-500 truncate">{nodeType}</div>
      </div>

      {/* Node body */}
      <div className="p-3">
        {/* Input values */}
        {inputSockets.length > 0 && (
          <div className="space-y-1">
            {inputSockets.map((socket) => (
              <div key={socket} className="flex items-center text-xs">
                <span className="text-gray-600 mr-2">{socket}:</span>
                <span className="text-gray-800">
                  {inputs?.[socket]?.value !== undefined
                    ? String(inputs[socket].value)
                    : "connected"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Output handles */}
      {outputSockets.map((socket, index) => (
        <Handle
          key={`output-${socket}`}
          type="source"
          position={Position.Right}
          id={socket}
          style={{
            top: 40 + index * 20,
            background: "#10b981",
          }}
        />
      ))}
    </div>
  );
}
