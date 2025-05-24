import type { NodeSpecJSON } from "@rune/behave-graph-core";
import React from "react";
import { type NodeProps as FlowNodeProps, useEdges } from "@xyflow/react";

import { useChangeNodeData } from "~/hooks/useChangeNodeData";
import { isHandleConnected } from "~/lib/flow/util/isHandleConnected";
import InputSocket from "./InputSocket";
import NodeContainer from "./NodeContainer";
import OutputSocket from "./OutputSocket";

type NodeProps = FlowNodeProps & {
  spec: NodeSpecJSON;
  allSpecs: NodeSpecJSON[];
};

const getPairs = <T, U>(arr1: T[], arr2: U[]) => {
  const max = Math.max(arr1.length, arr2.length);
  const pairs = [];
  for (let i = 0; i < max; i++) {
    const pair: [T | undefined, U | undefined] = [arr1[i], arr2[i]];
    pairs.push(pair);
  }
  return pairs;
};

export const Node: React.FC<NodeProps> = ({
  id,
  data,
  spec,
  selected,
  allSpecs,
}: NodeProps) => {
  const edges = useEdges();
  const handleChange = useChangeNodeData(id);

  // Separate execution and data ports for better layout
  const execInputs = spec.inputs.filter((input) => input.valueType === "flow");
  const dataInputs = spec.inputs.filter((input) => input.valueType !== "flow");
  const execOutputs = spec.outputs.filter(
    (output) => output.valueType === "flow"
  );
  const dataOutputs = spec.outputs.filter(
    (output) => output.valueType !== "flow"
  );

  const hasInputs = execInputs.length > 0 || dataInputs.length > 0;
  const hasOutputs = execOutputs.length > 0 || dataOutputs.length > 0;

  return (
    <NodeContainer
      title={spec.label}
      category={spec.category}
      selected={selected}
    >
      {/* Modern Layout: Side-by-side inputs and outputs */}
      {(hasInputs || hasOutputs) && (
        <div className="flex justify-between items-start gap-4">
          {/* Left Column: Inputs */}

          <div className="flex flex-col gap-2 flex-1">
            {/* Execution Inputs */}
            {execInputs.map((input) => (
              <InputSocket
                key={`exec-in-${input.name}`}
                {...input}
                specJSON={allSpecs}
                value={data[input.name] ?? input.defaultValue}
                onChange={handleChange}
                connected={isHandleConnected(edges, id, input.name, "target")}
              />
            ))}

            {/* Data Inputs */}
            {dataInputs.map((input) => (
              <InputSocket
                key={`data-in-${input.name}`}
                {...input}
                specJSON={allSpecs}
                value={data[input.name] ?? input.defaultValue}
                onChange={handleChange}
                connected={isHandleConnected(edges, id, input.name, "target")}
              />
            ))}
          </div>

          {/* Right Column: Outputs */}

          <div className="flex flex-col gap-2 flex-1">
            {/* Execution Outputs */}
            {execOutputs.map((output) => (
              <OutputSocket
                key={`exec-out-${output.name}`}
                {...output}
                specJSON={allSpecs}
                connected={isHandleConnected(edges, id, output.name, "source")}
              />
            ))}

            {/* Data Outputs */}
            {dataOutputs.map((output) => (
              <OutputSocket
                key={`data-out-${output.name}`}
                {...output}
                specJSON={allSpecs}
                connected={isHandleConnected(edges, id, output.name, "source")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fallback to original layout if no clear input/output separation */}
      {!hasInputs && !hasOutputs && (
        <div className="flex flex-col gap-2">
          {getPairs(spec.inputs, spec.outputs).map(([input, output], ix) => (
            <div
              key={ix}
              className="flex flex-row justify-between gap-8 relative"
            >
              {input && (
                <InputSocket
                  {...input}
                  specJSON={allSpecs}
                  value={data[input.name] ?? input.defaultValue}
                  onChange={handleChange}
                  connected={isHandleConnected(edges, id, input.name, "target")}
                />
              )}
              {output && (
                <OutputSocket
                  {...output}
                  specJSON={allSpecs}
                  connected={isHandleConnected(
                    edges,
                    id,
                    output.name,
                    "source"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </NodeContainer>
  );
};
