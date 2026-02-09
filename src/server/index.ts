import { startMcpServer } from "./mcp";
import { startBridge } from "./bridge";
import { logger } from "./logger";

async function main(): Promise<void> {
  startBridge();
  await startMcpServer();
}

main().catch((err) => {
  logger.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
