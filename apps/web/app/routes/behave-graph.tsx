import { useState } from "react";
import {
  registerCoreProfile,
  type GraphJSON,
  ManualLifecycleEventEmitter,
  DefaultLogger,
} from "@rune/behave-graph-core";
import { Flow } from "@rune/behave-graph-flow";

const exampleGraph: GraphJSON = {
  nodes: [
    {
      id: "1",
      type: "math/add/float",
      parameters: {
        a: { value: 5 },
        b: { value: 3 },
      },
      metadata: {
        positionX: "100",
        positionY: "100",
      },
    },
    {
      id: "2",
      type: "math/multiply/float",
      parameters: {
        a: { link: { nodeId: "1", socket: "result" } },
        b: { value: 2 },
      },
      metadata: {
        positionX: "300",
        positionY: "100",
      },
    },
    {
      id: "3",
      type: "debug/log",
      parameters: {
        text: { link: { nodeId: "2", socket: "result" } },
        severity: { value: "error" },
      },
      metadata: {
        positionX: "500",
        positionY: "200",
      },
    },
    {
      id: "4",
      type: "lifecycle/onStart",
      flows: {
        flow: { nodeId: "3", socket: "flow" },
      },
      metadata: {
        positionX: "300",
        positionY: "300",
      },
    },
  ],
};

export default function BehaveGraphDemo() {
  // Create a registry with the core profile
  const registry = registerCoreProfile({
    values: {},
    nodes: {},
    dependencies: {
      ILogger: new DefaultLogger(),
      ILifecycleEventEmitter: new ManualLifecycleEventEmitter(),
    },
  });

  const [currentGraph, setCurrentGraph] = useState<GraphJSON>(exampleGraph);

  // Examples object for the Flow component
  const examples = {
    "Basic Math": exampleGraph,
  };
  return (
    <div className="h-screen w-screen relative">
      <div className="absolute top-0 left-0 z-10 flex items-center gap-2 p-2">
        <img src="/logo.svg" className="size-6" />
        <h1 className="font-bold leading-none">rune</h1>
      </div>
      <div className="w-full h-full">
        <Flow
          initialGraph={currentGraph}
          registry={registry}
          examples={examples}
        />
      </div>
    </div>
  );
}
