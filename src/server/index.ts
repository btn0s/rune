import { startMcpServer } from "./mcp";
import { startBridge } from "./bridge";
import { logger } from "./logger";
import "./tools/create";
import "./tools/document";
import "./tools/layout";
import "./tools/style";
import "./tools/manipulate";
import "./tools/export";
import "./tools/components";
import "./tools/text";

async function main(): Promise<void> {
  startBridge();
  await startMcpServer();
}

main().catch((err) => {
  logger.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
