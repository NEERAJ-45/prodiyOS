import { executeTool } from './tools';
import type { AgentAction, AgentMessage, AgentResponse } from './types';

const MODEL = 'gemini-3.5-flash';
const MAX_ROUNDS = 3;
const MAX_HISTORY = 12;

const APP_PATHS = [
  '/', '/analytics', '/books', '/career', '/chat', '/command-center', '/daily', '/docs', '/focus',
  '/history', '/interview', '/interviews', '/mastery', '/patterns', '/plan/calendar', '/plan/resume',
  '/plan/study-plan', '/projects', '/revision', '/roadmaps', '/sticky-notes', '/tasks', '/weekly',
];

type Part = Record<string, unknown>;
type Content = { role: 'user' | 'model'; parts: Part[] };

const functionDeclarations = [
  {
    name: 'get_today_plan',
    description: "Get today's study slots and calendar plan events, with completion state.",
    parameters: {
      type: 'OBJECT',
      properties: { scheduleId: { type: 'STRING', description: 'steady | react | java | devops | custom' } },
    },
  },
  {
    name: 'list_plan_events',
    description: 'List calendar plan events between two dates (inclusive).',
    parameters: {
      type: 'OBJECT',
      properties: { from: { type: 'STRING' }, to: { type: 'STRING' } },
      required: ['from'],
    },
  },
  {
    name: 'set_event_done',
    description: 'Mark a calendar plan event done or not done.',
    parameters: {
      type: 'OBJECT',
      properties: { eventId: { type: 'STRING' }, done: { type: 'BOOLEAN' } },
      required: ['eventId', 'done'],
    },
  },
  {
    name: 'add_event_note',
    description: 'Set the note on a calendar plan event.',
    parameters: {
      type: 'OBJECT',
      properties: { eventId: { type: 'STRING' }, note: { type: 'STRING' } },
      required: ['eventId', 'note'],
    },
  },
  {
    name: 'run_action',
    description: 'Click a visible dashboard control by its id from the available actions list.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'STRING', description: 'Exact action id from the list' },
        confirmed: { type: 'BOOLEAN', description: 'True only if the user explicitly agreed to a dangerous action in this conversation' },
      },
      required: ['id'],
    },
  },
  {
    name: 'navigate',
    description: 'Open an in-app page for the user.',
    parameters: { type: 'OBJECT', properties: { path: { type: 'STRING' } }, required: ['path'] },
  },
];

function systemPrompt(today: string, actions: AgentAction[]) {
  const list = actions.length
    ? actions.map((a) => `- ${a.id}: ${a.label}${a.dangerous ? ' (DANGEROUS)' : ''}`).join('\n')
    : '- none on this screen';
  return [
    'You are the Samundar agent inside a study-tracking dashboard.',
    `Today is ${today}. Be brief: one to three short sentences, no markdown headings.`,
    'Use tools for facts. Never invent progress, tasks, or events.',
    'Available dashboard actions on the current screen:',
    list,
    'To use an action call run_action with its exact id. Dangerous actions need the user to explicitly agree first; only then pass confirmed=true.',
    `Use navigate only with one of these paths: ${APP_PATHS.join(', ')}.`,
    'If you cannot do something, say so plainly.',
  ].join('\n');
}

function toContents(messages: AgentMessage[]): Content[] {
  return messages
    .filter((m) => m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
}

function textOf(parts: Part[]) {
  return parts.map((part) => (typeof part.text === 'string' ? part.text : '')).join('').trim();
}

function functionCalls(parts: Part[]) {
  return parts
    .map((part) => part.functionCall as { name?: string; args?: Record<string, unknown> } | undefined)
    .filter((call): call is { name: string; args?: Record<string, unknown> } => !!call?.name);
}

function functionResponse(name: string, result: unknown): Part {
  return { functionResponse: { name, response: { result } } };
}

async function generate(apiKey: string, body: Record<string, unknown>) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini request failed (${res.status})`);
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Part[] } }> };
  return json.candidates?.[0]?.content?.parts ?? [];
}

export async function runAgent(input: {
  messages: AgentMessage[];
  actions: AgentAction[];
  email: string;
  apiKey: string;
  today: string;
}): Promise<AgentResponse> {
  const { messages, actions, email, apiKey, today } = input;
  const contents = toContents(messages);
  let run: string | undefined;
  let runDangerous = false;
  let navigate: string | undefined;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const parts = await generate(apiKey, {
      systemInstruction: { parts: [{ text: systemPrompt(today, actions) }] },
      contents,
      tools: [{ functionDeclarations }],
      generationConfig: { temperature: 0.4 },
    });

    const calls = functionCalls(parts);
    if (!calls.length) return { message: textOf(parts) || 'Done.', run, runDangerous: runDangerous || undefined, navigate };

    contents.push({ role: 'model', parts });
    const responses: Part[] = [];

    for (const call of calls) {
      const args = call.args ?? {};
      if (call.name === 'run_action') {
        const action = actions.find((item) => item.id === args.id);
        if (!action) {
          responses.push(functionResponse(call.name, { error: 'Unknown action id' }));
        } else if (action.dangerous && args.confirmed !== true) {
          responses.push(functionResponse(call.name, { error: 'User has not confirmed this dangerous action' }));
        } else {
          run = action.id;
          runDangerous = !!action.dangerous;
          responses.push(functionResponse(call.name, { ok: true }));
        }
      } else if (call.name === 'navigate') {
        const path = String(args.path ?? '');
        if (APP_PATHS.includes(path)) {
          navigate = path;
          responses.push(functionResponse(call.name, { ok: true }));
        } else {
          responses.push(functionResponse(call.name, { error: `Unknown path. Valid paths: ${APP_PATHS.join(', ')}` }));
        }
      } else {
        responses.push(functionResponse(call.name, await executeTool(call.name, args, { email, today })));
      }
    }

    contents.push({ role: 'user', parts: responses });
  }

  const parts = await generate(apiKey, {
    systemInstruction: { parts: [{ text: systemPrompt(today, actions) }] },
    contents,
    generationConfig: { temperature: 0.4 },
  });

  return { message: textOf(parts) || 'Done.', run, runDangerous: runDangerous || undefined, navigate };
}
