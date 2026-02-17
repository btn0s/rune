import { commandRegistry } from './commands/index';

figma.showUI(__html__, { width: 400, height: 420, themeColors: true });

figma.ui.onmessage = async (msg: { id?: string; type?: string; params?: Record<string, any>; storage_result?: any; storage_key?: string; width?: number; height?: number }) => {
  if (msg.type === 'ui_resize' && msg.width && msg.height) {
    figma.ui.resize(msg.width, msg.height);
    return;
  }

  if (msg.type === 'client_storage_set' && msg.storage_key !== undefined) {
    await figma.clientStorage.setAsync(msg.storage_key, msg.storage_result);
    return;
  }

  if (msg.type === 'client_storage_get' && msg.storage_key !== undefined) {
    const value = await figma.clientStorage.getAsync(msg.storage_key);
    figma.ui.postMessage({ type: 'client_storage_result', storage_key: msg.storage_key, value });
    return;
  }

  if (!msg.id || !msg.type) return;

  const handler = commandRegistry.get(msg.type);

  if (!handler) {
    figma.ui.postMessage({ id: msg.id, error: `Unknown command: ${msg.type}` });
    return;
  }

  try {
    const result = await handler(msg.params ?? {});
    figma.ui.postMessage({ id: msg.id, result });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    figma.ui.postMessage({ id: msg.id, error: errorMessage });
  }
};

figma.on('close', () => {
  figma.ui.postMessage({ type: 'plugin_closing' });
});
