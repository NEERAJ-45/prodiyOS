# Samundar Agent — Home Screen Agent Design

Date: 2026-11-20
Status: Approved

## Goal

Turn `/` into an always-present agent that can answer questions from app data and drive the dashboard — navigate, mutate data, and click registered controls.

## Non-goals (v1)

- Voice / Gemini Live
- Streaming responses
- Persistent conversation memory
- Desktop-level control (screen, mouse, OS)
- Blind DOM clicking of unregistered elements

## Architecture

```
Browser (/ agent shell)
  |  POST /api/agent { messages, actions: [{id,label,dangerous}] }
  v
Next route (/api/agent)
  |  Gemini generateContent + function declarations
  |  loop up to 3 rounds: execute tool -> feed result
  v
Response { message, run?: actionId, runDangerous?: boolean, navigate?: path }
  |
  v
Client executor: click [data-agent-action=run] | router.push(navigate) | report result to transcript
```

The server never touches the DOM. It only chooses an action id from the list the client sent, so any control can be agent-controllable without per-page wiring.

## Action registry

- A control joins by adding `data-agent-action="<id>"` and `data-agent-label="<human label>"`.
- `data-agent-danger` marks destructive controls.
- The client scans the DOM for these attributes before each request and sends `{id, label, dangerous}`.
- Executing an action dispatches a real `element.click()`.
- Ids are page-scoped in practice (unique per screen); duplicates resolve to the first visible element.

## Server tools

| Tool | Purpose |
| --- | --- |
| `get_today_plan` | Today's daily slots, calendar events for today, completion counts |
| `list_plan_events` | Calendar plan events for a date range |
| `set_event_done` | Tick/untick a calendar plan event |
| `add_event_note` | Append/replace a note on a calendar plan event |
| `navigate` | Return a path for the client to open |

Tools reuse existing services (`src/lib/services/schedule-plans.ts`, daily data access) and the authenticated session.

## Response contract

```ts
type AgentResponse = {
  message: string;
  run?: string;          // action id from the client-provided list
  runDangerous?: boolean; // required when the targeted action is marked dangerous
  navigate?: string;     // app path
};
```

## UI

- `/` renders the agent (the current `/ -> /command-center` redirect is removed; command-center keeps its route).
- Layout: centered orbital orb (framer-motion; idle / thinking / responding), transcript panel, single input, three quick prompts: "What's today?", "What's next?", "Open my calendar".
- Graphite theme tokens only; `--ring` is the sole accent.
- The agent runs inside the normal dashboard shell (sidebar + navbar stay).
- Empty state explains what the agent can do and that it can act on the dashboard.

## Error handling

- Missing `GOOGLE_API_KEY`: shell renders with an "Agent offline" notice; input disabled.
- Invalid/unknown action id: agent explains it cannot do that; no silent fallback.
- Dangerous action without `runDangerous`: client refuses and the agent must ask the user to type a confirmation request again.
- Tool failure: structured `{ error }` returned to the model; model explains to the user.
- Loop cap: 3 tool rounds, then final answer is forced.

## Testing

- Unit test for the action executor: attribute scan, dangerous gating, click dispatch.
- Unit test for one tool executor (`set_event_done`) against a stubbed service.
- Manual smoke: `curl` `/api/agent` with a sample message; verify tool use and `run` id.
- `npm run typecheck`, `npm run lint`, `npm run build`.

## Rollout

1. Route + shell + typed chat (no actions).
2. Tools.
3. Action registry + attributes on key controls: nav, daily tabs, slot checkboxes, focus timer, calendar date/import, mode toggle, command-center.
4. Safety attributes on destructive controls and confirmation flow.
