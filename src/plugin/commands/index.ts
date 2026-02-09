export type CommandHandler = (params: Record<string, any>) => Promise<any>;

export const commandRegistry = new Map<string, CommandHandler>();

import "./document";
import "./create";
import "./layout";
import "./style";
import "./manipulate";
import "./export";
import "./components";
import "./text";
