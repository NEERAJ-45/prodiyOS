# Agent RAG + LangGraph — Implementation Plan

Date: 2026-11-20
Status: proposed
Depends on: agent v1 (`src/lib/agent/*`), Atlas cluster (in `.env.local` today)

## 0. Gate: what is actually missing

Agent v1 answers from live DB reads (today's plan, plan events). It cannot answer:

- "What did I write in my note about Dijkstra?" → corpus exists (`Note`, `Doc/DocContent`, `BookContent`, `Article`, `Revision`, `ChatMessage`), but no retrieval.
- "Compare what I studied last week against the roadmap" → needs several ordered reads, one loop round each, which the 3-round cap makes unreliable.

RAG fixes the first. LangGraph is only worth it for the second.

Decision order: **Phase 1 + 2 first (plain RAG, no framework). Migrate to LangGraph only when multi-step tasks are actually requested.** Phase 3 is written out so the migration is a swap, not a rewrite.

## 1. Corpus and chunking

Sources, in priority order:

| Source | Model | Text | Key |
| --- | --- | --- | --- |
| Notes | `Note` | `content` | `_id`, title |
| Reader article | `ReaderArticle` | body | `_id` |
| Docs | `DocContent` | body | `docId` |
| Books | `BookContent` | body | `bookId` |
| Custom QA | `CustomQA` | question + answer | `_id` |
| Chat | `ChatMessage` | `content` | `_id`, role |

Rules that matter:

- Chunk by heading first, then ~800 chars with 120 overlap. `@langchain/textsplitters` `RecursiveCharacterTextSplitter` is fine and is the only reason to add a langchain package in phase 1.
- Store `userEmail` on every chunk. Retrieval is always filtered by it. This is the security boundary — never rely on the model to scope queries.
- `sourceType`, `sourceId`, `title`, `href` (`/notes/<id>` etc.) travel with the chunk so answers can link back.
- Skip chunks under 120 chars (nav noise, empty notes).

## 2. Storage and embeddings

Use the Atlas cluster already in `.env.local` — no new vector service.

- Embeddings: `gemini-embedding-001` at 768 dims via the already-installed `@google/genai`. One model, one dimension, no local model server.
- Collection: `chunks` (new model `src/lib/models/Chunk.ts`) with `embedding: number[768]`.
- Atlas Vector Search index `vector_index` on `chunks.embedding` with a `filter` field for `userEmail`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "userEmail" }
  ]
}
```

That index is created once in the Atlas UI/API, not in code. Note it in the PR body.

- Also keep a plain Mongo text/hashed lookup for exact id or title hits; semantic-only loses "the note called X".

## 3. Ingestion

One script: `scripts/index-corpus.mjs`, run manually and from a `postinstall`-free npm script `npm run index`.

- Pull changed docs since a `Cursor` doc (`{ userEmail, sourceType, lastRun }`) — no full re-embed each run.
- Batch 32 chunks per embed call; retry 429 with backoff (the free tier throttles, measured today).
- Idempotent: delete chunks where `sourceId` + `sourceType` before insert, so re-runs never duplicate.
- `--dry` prints counts only.

Acceptance: `npm run index` twice in a row leaves the same chunk count, and a query for a known note title returns it in the top 3.

## 4. Retrieval in the current agent (no framework)

This is the whole value of RAG and it is ~60 lines:

- New tool `search_knowledge` in `src/lib/agent/tools.ts`: `{ query, limit? }` → top 6 chunks, each `{ title, href, snippet }`, joined and truncated to ~1200 chars for the model.
- Add its `functionDeclaration` in `run-agent.ts`. The existing 3-round loop handles it. Raise the cap to 4.
- Prompt rule: "Use search_knowledge for anything about the user's own notes, docs, or history. Cite the title. Never invent note contents."
- Retrieval lives in `src/lib/agent/retrieval.ts` so phase 3 reuses it unchanged.

Acceptance checks (add to `src/lib/agent/__tests__/`):

- `retrieval.test.ts` — query returns only chunks for the given email (mock the Atlas aggregate).
- Live smoke: "what do my notes say about X" returns a real snippet and the correct title; a query with no match returns "nothing in your notes" instead of a hallucinated answer.

Latency budget: embed query ~200ms + Atlas search ~50ms + one model round ≈ 1.2s. Keeps the current ~2s feel.

## 5. Phase 3: LangGraph, only if multi-step work is real

Trigger: users ask for tasks like "replan my week" or "check my revision queue and reschedule what's overdue" — work that needs 3+ ordered tool calls with state between them.

Target design:

```
graph = StateGraph({
  messages: Annotation<BaseMessage[]>(reducer: concat),
  userEmail: Annotation<string>,
  today: Annotation<string>,
})
nodes: agent -> tools -> agent -> ... -> END   (conditional edge on tool_calls)
checkpointer: MongoDBSaver (collection `agent_checkpoints`, thread_id = sessionId)
```

Files:

- `src/lib/agent/graph.ts` — the graph, compiled once at module scope.
- `src/lib/agent/nodes.ts` — `agentNode` (`ChatGoogleGenerativeAI` + `bindTools`), `toolNode` (`ToolNode` with the same four tools plus `search_knowledge`).
- `src/app/api/agent/route.ts` — swap `runAgent()` for `graph.invoke({...}, { configurable: { thread_id } })`, stream tokens through `graph.streamEvents` when the client asks.
- Keep `run-agent.ts` until the graph passes the same smoke tests, then delete it in the same PR.

Dependencies (JS, v1.x): `@langchain/core`, `@langchain/google-genai`, `@langchain/langgraph`, `@langchain/mongodb`. That is ~4 packages and a meaningful bundle only on the server route — acceptable because the route is server-only.

What the checkpointer actually buys: conversation survives the sheet closing (today the transcript resets), and a failed tool call can resume instead of replaying the whole request.

Guardrails to port over, not lose in the rewrite:

- `APP_PATHS` navigation whitelist.
- `data-agent-danger` gating for destructive actions.
- `userEmail` injected server-side from the session, never from the model.
- Max 6 super-steps (`recursionLimit`) so a loop cannot burn quota.

## 6. Cost and quota

Free tier slowed the previous model badly. Per user message with RAG: 1 embedding (cheap) + 1 search + ~1.5 model calls at `gemini-3.1-flash-lite`. Indexing ~1k chunks costs one embed batch pass. Budget a hard cap: 40 agent calls/hour/user, return the existing `503 agent_offline` shape when exceeded.

## 7. Order of work

1. `Chunk` model + Atlas index (manual step) — 30 min
2. `scripts/index-corpus.mjs` + `npm run index` — 1–2 h
3. `retrieval.ts` + `search_knowledge` tool + prompt rule — 1 h
4. Tests + live smoke — 30 min
5. **Stop here unless multi-step demand is real.**
6. LangGraph swap behind the same route contract — 3–4 h
7. Checkpointer + streaming + `run-agent.ts` deletion — 2 h
8. Re-run agent smoke suite, compare latency before/after

## 8. Risks

- **Atlas Vector Search is the only new hard dependency.** Local `mongod` has no vector search; if the dev database is ever moved off Atlas, phase 2 breaks. Fallback: in-memory cosine over `Chunk` capped at 5k docs (fine for one user, not for many).
- **LangGraph rewrite risk is real** — it replaces the thing that works. The plan keeps v1 alive until parity tests pass, and phase 3 is opt-in.
- **Chunk staleness**: notes edited after indexing are invisible until the next run. Mitigate with an `updatedAt` cursor and an "index now" button in settings if notes start to matter.

## 9. Rollback

- Phase 2 adds only new files plus two edits (`tools.ts`, `run-agent.ts`). Revert those two edits and the agent behaves exactly as today; `Chunk` data can stay.
- Phase 3 keeps `run-agent.ts` until parity, so rollback is a one-line branch in the route.

## 10. Explicitly not doing

- No separate vector DB, no Pinecone/Chroma/pgvector.
- No LangChain chat model in phase 1 — one `fetch` to Gemini is already in place and faster than a wrapper.
- No reranker model, no hybrid BM25 tuning until retrieval quality is measured and shown to be lacking.
- No agent-authored writes to the corpus (no self-indexing notes).
