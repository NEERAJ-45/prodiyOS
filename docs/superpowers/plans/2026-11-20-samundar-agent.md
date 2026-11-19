# Samundar Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` an agent that answers from app data and drives the dashboard through a declarative action registry.

**Architecture:** A `/api/agent` route runs a bounded Gemini function-calling loop over server-side tools (today's plan, calendar events, tick/note). The client sends the list of visible `[data-agent-action]` controls with each message; the route may answer with `run` or `navigate`, which the client executes and reports back.

**Tech Stack:** Next.js App Router, Gemini REST (`fetch`, no SDK), Mongoose, TanStack Query, Zustand, framer-motion, Vitest.

## Global Constraints

- No new npm dependencies.
- Model: `gemini-2.5-flash` via `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=$GOOGLE_API_KEY`.
- Key read from `process.env.GOOGLE_API_KEY`; missing key → `503 { error: "agent_offline" }`.
- Tool loop capped at 3 rounds.
- All routes authenticate with `auth()`; user email from session.
- UI uses existing theme tokens only; `--ring` is the only accent.
- Files stay focused: `src/lib/agent/*` server lib, `src/components/agent/*` UI.

---

### Task 1: Agent types, tool executors, tests

**Files:**
- Create: `src/lib/agent/types.ts`, `src/lib/agent/tools.ts`, `src/lib/agent/__tests__/tools.test.ts`

**Interfaces:**
- Produces: `AgentAction { id: string; label: string; dangerous?: boolean }`, `AgentMessage { role: 'user' | 'assistant'; content: string }`, `AgentResponse { message: string; run?: string; runDangerous?: boolean; navigate?: string }`
- Produces: `executeTool(name: string, args: Record<string, unknown>, ctx: { email: string; today: string }): Promise<{ ok: boolean; data?: unknown; error?: string }>`

- [ ] **Step 1: Types**

```ts
export type AgentRole = 'user' | 'assistant';
export interface AgentMessage { role: AgentRole; content: string }
export interface AgentAction { id: string; label: string; dangerous?: boolean }
export interface AgentResponse { message: string; run?: string; runDangerous?: boolean; navigate?: string }
export type ToolResult = { ok: true; data: unknown } | { ok: false; error: string };
```

- [ ] **Step 2: Write failing tests** for `executeTool` with stubbed model calls: unknown tool → error; `set_event_done` delegates to the plan update path.

- [ ] **Step 3: Implement tools**

```ts
export async function executeTool(name, args, ctx): Promise<ToolResult> {
  switch (name) {
    case 'get_today_plan': ...
    case 'list_plan_events': ...
    case 'set_event_done': ...
    case 'add_event_note': ...
    default: return { ok: false, error: `Unknown tool ${name}` };
  }
}
```

`get_today_plan` returns `{ today: ctx.today, dayName, slots: [{period, topic}], completedSlotIds, calendar: [{plan, event}] }` using `SCHEDULES.steady` (or `args.scheduleId`) and `DailyRecord.findOne({ date: ctx.today, userEmail: ctx.email })`.
`list_plan_events` returns events in `[from, to]`, capped at 200, with `planName`, `eventId`, `scheduleId`.
`set_event_done` / `add_event_note` update the owning `SchedulePlan` (`{ 'events.id': eventId }` + `userEmail`) and mirror `status`.

- [ ] **Step 4: Run** `npx vitest run src/lib/agent` → PASS
- [ ] **Step 5: Commit**

---

### Task 2: Gemini runner + `/api/agent`

**Files:**
- Create: `src/lib/agent/run-agent.ts`, `src/app/api/agent/route.ts`

**Interfaces:**
- Consumes: `executeTool`, types from Task 1.
- Produces: `runAgent(input: { messages: AgentMessage[]; actions: AgentAction[]; email: string }): Promise<AgentResponse>`

- [ ] **Step 1: Runner**

Function declarations: `get_today_plan`, `list_plan_events`, `set_event_done`, `add_event_note`, `run_action`, `navigate`.
Loop:

```ts
for (let round = 0; round < 3; round++) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const parts = (await res.json()).candidates?.[0]?.content?.parts ?? [];
  const calls = parts.filter((p) => p.functionCall);
  if (!calls.length) return { message: textOf(parts) };
  contents.push({ role: 'model', parts });
  for (const call of calls) {
    if (call.functionCall.name === 'run_action') {
      const action = actions.find((a) => a.id === call.functionCall.args.id);
      if (!action) results.push(response(call, { error: 'unknown action' }));
      else results.push(response(call, { ok: true }));
    } else if (call.functionCall.name === 'navigate') { navigate = String(call.functionCall.args.path); ... }
    else results.push(response(call, await executeTool(...)));
  }
  contents.push({ role: 'user', parts: results });
}
```

`run_action` sets `run`/`runDangerous`; dangerous actions without `args.confirmed === true` set neither and answer asking the user to confirm. `navigate` must match `^/[a-z0-9\-/?=&]*$` and be an in-app path.

- [ ] **Step 2: Route** — `auth()` → 401; missing key → 503 `{ error: 'agent_offline' }`; validate body `messages` array; call `runAgent`; `try/catch` → 502 `{ error }`.
- [ ] **Step 3: Smoke test** the route with curl once the dev server is running.
- [ ] **Step 4: Commit**

---

### Task 3: Client action registry + test

**Files:**
- Create: `src/lib/agent/actions.ts`, `src/lib/agent/__tests__/actions.test.ts`

**Interfaces:**
- Produces: `scanActions(root?: ParentNode): AgentAction[]`, `runAction(id: string, options?: { allowDangerous?: boolean }): { ok: boolean; error?: string }`

- [ ] **Step 1: Failing test** (jsdom): element with `data-agent-action` appears in `scanActions`; dangerous element is blocked without `allowDangerous`; click fires once.
- [ ] **Step 2: Implement**

```ts
export function scanActions(root: ParentNode = document) {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-agent-action]')).map((el) => ({
    id: el.dataset.agentAction!,
    label: el.dataset.agentLabel || el.textContent?.trim() || el.dataset.agentAction!,
    dangerous: el.hasAttribute('data-agent-danger') || undefined,
  }));
}
```

`runAction` finds the first matching element, refuses `data-agent-danger` without `allowDangerous`, calls `el.click()`, returns `{ ok: true }`.

- [ ] **Step 3: Run tests** → PASS
- [ ] **Step 4: Commit**

---

### Task 4: Agent shell at `/`

**Files:**
- Create: `src/components/agent/AgentShell.tsx`, `src/components/agent/AgentOrb.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `/api/agent` contract, `scanActions`, `runAction`.
- Produces: the page at `/`.

- [ ] **Step 1: `page.tsx`** renders `<AgentShell />` (no redirect).
- [ ] **Step 2: `AgentOrb`** — concentric rings + core, framer-motion; states `idle | thinking | responding`; `useReducedMotion` disables animation.
- [ ] **Step 3: `AgentShell`** — transcript (user right / agent left, plain text), input + send, three quick prompts, busy state, offline banner on 503, error line on failure, auto-scroll. On response: append message, then `runAction(run, { allowDangerous: runDangerous })` or `router.push(navigate)`; append a one-line confirmation ("Started focus timer" / "Opened /daily").
- [ ] **Step 4: Commit**

---

### Task 5: Register dashboard controls

**Files:**
- Modify: `src/components/layout/sidebar.tsx`, `src/components/daily/ScheduleTabs.tsx`, `src/components/daily/SlotCard.tsx`, `src/components/daily/FocusTimer.tsx`, `src/app/(dashboard)/plan/calendar/page.tsx`, `src/components/layout/mode-toggle.tsx`

**Interfaces:** consumes nothing; adds attributes only.

- [ ] **Step 1: Navigation** — each sidebar `Link` gets `data-agent-action={'nav-' + href}` and `data-agent-label={'Open ' + label}`.
- [ ] **Step 2: Daily** — schedule tabs: `data-agent-action={'tab-' + tab.id}`; slot toggle: `data-agent-action={'slot-' + slot.period}`; focus timer start/pause/reset: `focus-start` / `focus-pause` / `focus-reset`.
- [ ] **Step 3: Calendar** — day cells `data-agent-action={'day-' + key}`, import button `calendar-import`, plan delete `data-agent-danger`.
- [ ] **Step 4: Mode** — HOME/OFFICE buttons labelled.
- [ ] **Step 5: Commit**

---

### Task 6: Verify

- [ ] **Step 1:** `npm run typecheck`
- [ ] **Step 2:** `npm run lint`
- [ ] **Step 3:** `npm run test`
- [ ] **Step 4:** `npm run build`
- [ ] **Step 5:** Manual: ask "what's today", "tick off X", "open calendar", confirm dangerous refusal.
- [ ] **Step 6:** Commit any fixes.
