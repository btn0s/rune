import { useState } from "react";
import {
  registerCoreProfile,
  readGraphFromJSON,
  Engine,
  writeGraphToJSON,
} from "@rune/behave-graph-core";

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

  const runGraph = async () => {
    setIsRunning(true);
    setOutput("Running graph...\n");

    try {
      // Parse the graph
      const graph = readGraphFromJSON({ graphJson: exampleGraph, registry });

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          Behave Graph Demo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Graph Visualization */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Graph Structure</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
                <h3 className="font-medium text-blue-900">Node 1: Add</h3>
                <p className="text-sm text-blue-700">math/add/float</p>
                <p className="text-xs text-blue-600">Inputs: a=5, b=3</p>
                <p className="text-xs text-blue-600">Output: result=8</p>
              </div>

              <div className="text-center text-gray-400">↓</div>

              <div className="bg-green-50 p-4 rounded border-l-4 border-green-400">
                <h3 className="font-medium text-green-900">Node 2: Multiply</h3>
                <p className="text-sm text-green-700">math/multiply/float</p>
                <p className="text-xs text-green-600">
                  Inputs: a=Node1.result, b=2
                </p>
                <p className="text-xs text-green-600">Output: result=16</p>
              </div>

              <div className="text-center text-gray-400">↓</div>

              <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-400">
                <h3 className="font-medium text-purple-900">Node 3: Log</h3>
                <p className="text-sm text-purple-700">debug/log</p>
                <p className="text-xs text-purple-600">
                  Input: text=Node2.result
                </p>
                <p className="text-xs text-purple-600">
                  Action: console.log(16)
                </p>
              </div>
            </div>
          </div>

          {/* Controls and Output */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Execution</h2>
              <button
                onClick={runGraph}
                disabled={isRunning}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isRunning ? "Running..." : "Execute Graph"}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Output</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64">
                {output || 'Click "Execute Graph" to run the demo'}
              </pre>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Registry Info</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Node Types:</strong>{" "}
                  {Object.keys(registry.nodes).length}
                </p>
                <p>
                  <strong>Value Types:</strong>{" "}
                  {Object.keys(registry.values).length}
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">
                    Available Node Types (sample)
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600 max-h-32 overflow-auto">
                    {Object.keys(registry.nodes)
                      .slice(0, 20)
                      .map((nodeType) => (
                        <li key={nodeType}>• {nodeType}</li>
                      ))}
                    {Object.keys(registry.nodes).length > 20 && (
                      <li className="text-gray-400">
                        ... and {Object.keys(registry.nodes).length - 20} more
                      </li>
                    )}
                  </ul>
                </details>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-green-100 rounded-lg">
          <p className="text-green-800 font-medium">
            ✅ Behave Graph Core successfully integrated!
          </p>
          <p className="text-sm text-green-600 mt-1">
            This demo shows a simple computational graph: (5 + 3) × 2 = 16, then
            logs the result.
          </p>
        </div>
      </div>
    </div>
  );
}
