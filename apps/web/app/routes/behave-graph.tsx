import { useState } from "react";
import {
  registerCoreProfile,
  type GraphJSON,
  ManualLifecycleEventEmitter,
  DefaultLogger,
} from "@rune/behave-graph-core";
import { Flow } from "~/components/flow";



const exampleGraph: GraphJSON = {
  nodes: [
    {
      id: "5",
      type: "logic/concat/string",
      metadata: {
        positionX: "1005.5883950556245",
        positionY: "325.9168907787993",
      },
      parameters: {
        a: {
          value: "Counter value: ",
        },
        b: {
          link: {
            nodeId: "6",
            socket: "result",
          },
        },
      },
    },
    {
      id: "6",
      type: "math/toString/integer",
      metadata: {
        positionX: "1007.513352743644",
        positionY: "478.9118166289154",
      },
      parameters: {
        a: {
          link: {
            nodeId: "9e08d997-42f3-4577-9bfc-19d587031742",
            socket: "count",
          },
        },
      },
    },
    {
      id: "d78c95bf-f61f-451f-b5ac-8f0ead3377c0",
      type: "lifecycle/onStart",
      metadata: {
        positionX: "235",
        positionY: "139",
      },
      flows: {
        flow: {
          nodeId: "7c1b7018-5d02-411a-a2de-b7374bcaac3a",
          socket: "flow",
        },
      },
    },
    {
      id: "7c1b7018-5d02-411a-a2de-b7374bcaac3a",
      type: "debug/log",
      metadata: {
        positionX: "473",
        positionY: "139",
      },
      flows: {
        flow: {
          nodeId: "9e08d997-42f3-4577-9bfc-19d587031742",
          socket: "flow",
        },
      },
    },
    {
      id: "9e08d997-42f3-4577-9bfc-19d587031742",
      type: "flow/counter",
      metadata: {
        positionX: "740.5366749163838",
        positionY: "141.03752115599016",
      },
      flows: {
        flow: {
          nodeId: "2ad7bdeb-1c24-4a75-ae76-80c67b511b25",
          socket: "flow",
        },
      },
    },
    {
      id: "2ad7bdeb-1c24-4a75-ae76-80c67b511b25",
      type: "debug/log",
      metadata: {
        positionX: "1003",
        positionY: "141.33769040391144",
      },
      parameters: {
        text: {
          link: {
            nodeId: "5",
            socket: "result",
          },
        },
      },
    },
  ],
  variables: [],
  customEvents: [],
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
    "Complex Demo": exampleGraph,
    "Basic Math": {
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
            positionX: "400",
            positionY: "100",
          },
        },
        {
          id: "3",
          type: "debug/log",
          parameters: {
            text: { link: { nodeId: "2", socket: "result" } },
            severity: { value: "info" },
          },
          metadata: {
            positionX: "700",
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
            positionX: "400",
            positionY: "300",
          },
        },
      ],
    } as GraphJSON,
  };

  return (
    <div className="h-screen w-screen relative">
      <div className="absolute top-[15px] left-[15px] z-10 flex flex-col gap-4 max-w-sm">
        <div className="flex items-center gap-2">
          <img
            src="/logo.svg"
            className="size-6 border border-foreground/20 rounded-md overflow-hidden"
          />
          <h1 className="font-bold leading-none">rune</h1>
        </div>
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
