import { NodeSpecJSON, OutputSocketSpecJSON } from "@rune/behave-graph-core";
import cx from "classnames";
import React from "react";
import {
  Connection,
  Handle,
  Position,
  useReactFlow,
  useNodeConnections,
} from "@xyflow/react";
import {
  TbSquareRoundedChevronRight,
  TbSquareRoundedChevronRightFilled,
} from "react-icons/tb";
import { FaRegCircle, FaRegDotCircle } from "react-icons/fa";

import { getValueTypeColors } from "../util/colors.js";
import { isValidConnection } from "../util/isValidConnection.js";
import { cn } from "../lib/utils.js";

export type OutputSocketProps = {
  connected: boolean;
  specJSON: NodeSpecJSON[];
} & OutputSocketSpecJSON;

export default function OutputSocket({
  specJSON,
  connected,
  valueType,
  name,
}: OutputSocketProps) {
  const instance = useReactFlow();
  const connections = useNodeConnections();

  const isFlowSocket = valueType === "flow";
  const isConnected =
    connected ||
    !!connections.find((connection) => connection.sourceHandle === name);

  const colors = getValueTypeColors(valueType, "default");
  const showName = isFlowSocket === false || name !== "flow";

  return (
    <div
      className={cn(
        "relative flex gap-1 flex-row justify-end",
        !isFlowSocket && !isConnected ? "items-start" : "items-center"
      )}
    >
      {/* Label */}
      {showName && (
        <label className="text-xs text-foreground capitalize">{name}</label>
      )}

      {/* Handle with Icon */}
      <Handle
        id={name}
        type="source"
        position={Position.Right}
        className={cn(
          "group flex items-center justify-center !border-none !m-0 !p-0 !max-w-none !max-h-none !h-fit !w-fit !bg-transparent !relative !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !transform-none !rounded-none",
          !isFlowSocket && !isConnected ? "mt-3" : ""
        )}
        isValidConnection={(connection) =>
          isValidConnection(connection as Connection, instance, specJSON)
        }
      >
        {isFlowSocket ? (
          isConnected ? (
            <TbSquareRoundedChevronRightFilled
              className={cn(
                "pointer-events-none",
                isConnected
                  ? "text-foreground"
                  : "text-foreground/50 hover:text-foreground"
              )}
            />
          ) : (
            <TbSquareRoundedChevronRight
              className={cn(
                "pointer-events-none",
                isConnected
                  ? "text-foreground"
                  : "text-foreground/50 hover:text-foreground"
              )}
            />
          )
        ) : isConnected ? (
          <FaRegDotCircle
            className={cx(
              "pointer-events-none rounded-full text-foreground",
              colors.background
            )}
          />
        ) : (
          <FaRegCircle
            className={cx(
              "pointer-events-none !bg-none rounded-full",
              colors.text
            )}
          />
        )}
      </Handle>
    </div>
  );
}
