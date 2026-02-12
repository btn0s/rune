export type CommandHandler = (params: Record<string, any>) => Promise<any>;

export const commandRegistry = new Map<string, CommandHandler>();
