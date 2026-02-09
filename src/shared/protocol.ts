/**
 * Protocol types for communication between Figma plugin and MCP server
 */

export interface CommandMessage {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface ResponseMessage {
  id: string;
  result?: any;
  error?: string;
}

export interface StatusMessage {
  type: 'connected' | 'disconnected' | 'error';
  message: string;
}
