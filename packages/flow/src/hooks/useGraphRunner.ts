import { useCallback, useState } from "react";
import {
  GraphJSON,
  IRegistry,
  readGraphFromJSON,
  Engine,
} from "@rune/behave-graph-core";

export function useGraphRunner(registry: IRegistry) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("");

  const runGraph = useCallback(
    async (graphJson: GraphJSON) => {
      setIsRunning(true);
      setOutput("Running graph...\n");

      try {
        // Parse the graph
        const graph = readGraphFromJSON({ graphJson, registry });

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
          `Graph executed successfully!\n\nConsole output:\n${logOutput}`
        );
      } catch (error) {
        setOutput(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        setIsRunning(false);
      }
    },
    [registry]
  );

  return {
    runGraph,
    isRunning,
    output,
  };
}
