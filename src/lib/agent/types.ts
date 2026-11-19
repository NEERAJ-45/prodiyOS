export type AgentRole = 'user' | 'assistant';

export interface AgentMessage {
  role: AgentRole;
  content: string;
}

export interface AgentAction {
  id: string;
  label: string;
  dangerous?: boolean;
}

export interface AgentResponse {
  message: string;
  run?: string;
  runDangerous?: boolean;
  navigate?: string;
}

export type ToolResult = { ok: true; data: unknown } | { ok: false; error: string };
