import type { GraphJSON } from "@rune/behave-graph-core";
import type { ProjectTemplate } from "../types/project";

// Complex demo graph from the current behave-graph.tsx
const complexDemoGraph: GraphJSON = {
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

// Basic math graph from the current behave-graph.tsx
const basicMathGraph: GraphJSON = {
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
  variables: [],
  customEvents: [],
};

// Empty starter graph
const emptyGraph: GraphJSON = {
  nodes: [],
  variables: [],
  customEvents: [],
};

// React button interaction example
const reactButtonGraph: GraphJSON = {
  nodes: [
    {
      id: "button-1",
      type: "ui/button",
      metadata: {
        positionX: "100",
        positionY: "100",
      },
      parameters: {
        text: { value: "Click me!" },
        variant: { value: "primary" },
      },
      flows: {
        onClick: {
          nodeId: "counter-1",
          socket: "flow",
        },
      },
    },
    {
      id: "counter-1",
      type: "flow/counter",
      metadata: {
        positionX: "400",
        positionY: "100",
      },
      flows: {
        flow: {
          nodeId: "text-1",
          socket: "flow",
        },
      },
    },
    {
      id: "text-1",
      type: "ui/text",
      metadata: {
        positionX: "700",
        positionY: "100",
      },
      parameters: {
        text: {
          link: {
            nodeId: "format-1",
            socket: "result",
          },
        },
      },
    },
    {
      id: "format-1",
      type: "logic/concat/string",
      metadata: {
        positionX: "700",
        positionY: "250",
      },
      parameters: {
        a: { value: "Clicked " },
        b: {
          link: {
            nodeId: "counter-1",
            socket: "count",
          },
        },
      },
    },
  ],
  variables: [],
  customEvents: [],
};

export function createDefaultTemplates(): ProjectTemplate[] {
  return [
    {
      id: "complex-demo",
      name: "Graph Editor Demo",
      description:
        "The original complex demo from behave-graph showing lifecycle, counters, and string formatting",
      platform: "react",
      graph: complexDemoGraph,
      config: {
        rune: {
          version: "0.1.0",
          studio: {
            graphFile: "./src/app.graph.json",
            componentsDir: "./src/components",
            outputDir: "./src/generated",
          },
          platform: {
            react: {
              framework: "remix",
              uiLibrary: "shadcn",
              outputFormat: "tsx",
            },
          },
        },
        dependencies: {
          "@rune/runtime-react": "^0.1.0",
        },
      },
      category: "demo",
    },
    {
      id: "basic-math",
      name: "Math Operations",
      description:
        "Simple math operations demonstrating basic node connections and calculations",
      platform: "react",
      graph: basicMathGraph,
      config: {
        rune: {
          version: "0.1.0",
          studio: {
            graphFile: "./src/app.graph.json",
            componentsDir: "./src/components",
            outputDir: "./src/generated",
          },
          platform: {
            react: {
              framework: "remix",
              uiLibrary: "shadcn",
              outputFormat: "tsx",
            },
          },
        },
        dependencies: {
          "@rune/runtime-react": "^0.1.0",
        },
      },
      category: "example",
    },
    {
      id: "empty-starter",
      name: "Empty Project",
      description: "Start from scratch with an empty graph",
      platform: "react",
      graph: emptyGraph,
      config: {
        rune: {
          version: "0.1.0",
          studio: {
            graphFile: "./src/app.graph.json",
            componentsDir: "./src/components",
            outputDir: "./src/generated",
          },
          platform: {
            react: {
              framework: "remix",
              uiLibrary: "shadcn",
              outputFormat: "tsx",
            },
          },
        },
        dependencies: {
          "@rune/runtime-react": "^0.1.0",
        },
      },
      category: "starter",
    },
    {
      id: "react-button-demo",
      name: "React Button Interaction",
      description:
        "Interactive button with click counter demonstrating UI component integration",
      platform: "react",
      graph: reactButtonGraph,
      config: {
        rune: {
          version: "0.1.0",
          studio: {
            graphFile: "./src/app.graph.json",
            componentsDir: "./src/components",
            outputDir: "./src/generated",
          },
          platform: {
            react: {
              framework: "remix",
              uiLibrary: "shadcn",
              outputFormat: "tsx",
            },
          },
        },
        dependencies: {
          "@rune/runtime-react": "^0.1.0",
          react: "^19.0.0",
        },
      },
      category: "example",
    },
  ];
}
