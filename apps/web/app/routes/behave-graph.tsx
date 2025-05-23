import { useState } from "react";
import {
  registerCoreProfile,
  readGraphFromJSON,
  Engine,
  writeGraphToJSON,
  type GraphJSON,
} from "@rune/behave-graph-core";
import { BehaveGraphFlow } from "@rune/flow";
import "@xyflow/react/dist/style.css";

export default function BehaveGraphDemo() {
  // Create a registry with the core profile
  const registry = registerCoreProfile({
    values: {},
    nodes: {},
    dependencies: {},
  });

  // Simple example graph - a basic math operation
  const exampleGraph = {
    nodes: [
      {
        id: "1",
        type: "math/add/float",
        inputs: {
          a: { value: 5 },
          b: { value: 3 },
        },
      },
      {
        id: "2",
        type: "math/multiply/float",
        inputs: {
          a: { link: { nodeId: "1", socket: "result" } },
          b: { value: 2 },
        },
      },
      {
        id: "3",
        type: "debug/log",
        inputs: {
          text: { link: { nodeId: "2", socket: "result" } },
        },
      },
    ],
  };

  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentGraph, setCurrentGraph] = useState<GraphJSON>(exampleGraph);

  const handleGraphChange = (graph: GraphJSON) => {
    setCurrentGraph(graph);
  };

  const runGraph = async () => {
    setIsRunning(true);
    setOutput("Running graph...\n");

    try {
      // Parse the graph
      const graph = readGraphFromJSON({ graphJson: currentGraph, registry });

      // Create and run the engine
      const engine = new Engine(graph.nodes);

      // Capture console.log output
      const originalLog = console.log;
      let logOutput = "";
      console.log = (...args) => {
        logOutput += args.join(" ") + "\n";
        originalLog(...args);
      };

      // Execute the graph
      await engine.executeAllAsync();

      // Restore console.log
      console.log = originalLog;

      setOutput(
        `Graph executed successfully!\n\nCalculation: (5 + 3) × 2 = 16\n\nConsole output:\n${logOutput}`
      );
    } catch (error) {
      setOutput(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen w-screen relative">
      {/* Run Button - Top Right */}
      <div className="absolute top-4 right-4 z-50 flex gap-3">
        <button
          onClick={runGraph}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg font-medium"
        >
          {isRunning ? "Running..." : "Run Graph"}
        </button>

        {/* Output Panel Toggle */}
        {output && (
          <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Output:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded max-h-32 overflow-auto">
              {output}
            </pre>
          </div>
        )}
      </div>

      {/* Fullscreen Flow Editor */}
      <BehaveGraphFlow
        initialGraph={currentGraph}
        registry={registry}
        onGraphChange={handleGraphChange}
        className="w-full h-full"
      />
    </div>
  );
}
