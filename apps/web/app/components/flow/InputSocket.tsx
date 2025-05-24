import type {
  InputSocketSpecJSON,
  NodeSpecJSON,
} from "@rune/behave-graph-core";
import cx from "classnames";
import React from "react";
import {
  type Connection,
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

import { getValueTypeColors } from "~/lib/flow/util/colors";
import { isValidConnection } from "~/lib/flow/util/isValidConnection";
import { AutoSizeInput } from "./AutoSizeInput";
import { cn } from "~/lib/utils";

export type InputSocketProps = {
  connected: boolean;
  value: any | undefined;
  onChange: (key: string, value: any) => void;
  specJSON: NodeSpecJSON[];
} & InputSocketSpecJSON;

const InputFieldForValue = ({
  choices,
  value,
  defaultValue,
  onChange,
  name,
  valueType,
}: Pick<
  InputSocketProps,
  "choices" | "value" | "defaultValue" | "name" | "onChange" | "valueType"
>) => {
  const showChoices = choices?.length;
  const inputVal = String(value) ?? defaultValue ?? "";

  const inputClassName =
    "text-xs h-6 bg-gray-50 border border-gray-200 rounded px-2 nodrag focus:outline-none focus:ring-1 focus:ring-blue-300";

  if (showChoices)
    return (
      <select
        className={inputClassName}
        value={value ?? defaultValue ?? ""}
        onChange={(e) => onChange(name, e.currentTarget.value)}
      >
        <>
          {choices.map((choice) => (
            <option key={choice.text} value={choice.value}>
              {choice.text}
            </option>
          ))}
        </>
      </select>
    );

  return (
    <>
      {valueType === "string" && (
        <AutoSizeInput
          type="text"
          className={inputClassName}
          value={inputVal}
          onChange={(e) => onChange(name, e.currentTarget.value)}
          placeholder="..."
        />
      )}
      {(valueType === "number" ||
        valueType === "float" ||
        valueType === "integer") && (
        <AutoSizeInput
          type="number"
          className={inputClassName}
          value={inputVal}
          onChange={(e) => onChange(name, e.currentTarget.value)}
          placeholder="0"
        />
      )}
      {valueType === "boolean" && (
        <input
          type="checkbox"
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 nodrag"
          checked={Boolean(value)}
          onChange={(e) => onChange(name, e.currentTarget.checked)}
        />
      )}
    </>
  );
};

const InputSocket: React.FC<InputSocketProps> = ({
  connected,
  specJSON,
  ...rest
}) => {
  const { value, name, valueType, defaultValue, choices } = rest;
  const instance = useReactFlow();
  const connections = useNodeConnections();

  const isFlowSocket = valueType === "flow";
  const isConnected =
    connected ||
    !!connections.find((connection) => connection.targetHandle === name);

  const colors = getValueTypeColors(valueType, "default");
  const showName = isFlowSocket === false || name !== "flow";

  return (
    <div
      className={cn(
        "relative flex gap-1 flex-row",
        !isFlowSocket && !isConnected ? "items-start" : "items-center"
      )}
    >
      {/* Handle with Icon */}
      <Handle
        id={name}
        type="target"
        position={Position.Left}
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
            className={cn(
              "pointer-events-none rounded-full",
              colors.background
            )}
          />
        ) : (
          <FaRegCircle
            className={cn(
              "pointer-events-none !bg-none rounded-full",
              colors.text
            )}
          />
        )}
      </Handle>

      {/* Label and Input Container */}
      <div className="flex flex-col gap-1 flex-1">
        {showName && (
          <label className="text-xs text-foreground capitalize">{name}</label>
        )}

        {!isFlowSocket && !isConnected && (
          <div className="flex items-center">
            <InputFieldForValue {...rest} />
          </div>
        )}
      </div>
    </div>
  );
};

export default InputSocket;
