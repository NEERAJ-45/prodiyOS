# Samundar — ProdigyOS Learning Tracker

## Project Overview
A full-stack learning progress tracking platform built with Next.js, MongoDB, and Tailwind CSS. Features include DSA problem tracking, learning roadmaps, daily schedule management, spaced-revision system, and analytics dashboard.

## Architecture
- **Framework**: Next.js (App Router)
- **Auth**: NextAuth v5 with Credentials provider, JWT sessions, brute-force lockout
- **Database**: MongoDB via Mongoose (optional, localStorage-first with DB sync)
- **Data Fetching**: TanStack Query v5 (React Query) for all HTTP API calls — `useQuery` for reads, `useMutation` for writes with automatic cache invalidation
- **Styling**: Tailwind CSS v4
- **State**: React hooks + Zustand (mode-store) + localStorage for client state; MongoDB for persistence

## Data Fetching Conventions
- All API data is fetched via shared hooks in `src/hooks/` using `@tanstack/react-query`
- `QueryProvider` wraps the app (in `src/components/providers/QueryProvider.tsx`) with `ReactQueryDevtools` in dev
- Available shared hooks:
  - `useCompletionsQuery(storagePrefix)` / `useToggleCompletion()` — `/api/db/completions`
  - `useNotesQuery(storagePrefix)` / `useSaveNote()` — `/api/db/notes`
  - `useCustomTopicsQuery(storagePrefix)` / `useAddCustomTopic()` / `useDeleteCustomTopic()` — `/api/db/custom-topics`
  - `useDailyQuery(date)` / `useSyncDaily()` / `useActivityLog()` — `/api/db/daily` and `/api/db/activity`
- Query keys follow convention: `['resource', ...params]` (e.g. `['completions', prefix]`, `['daily', date]`)
- Mutations automatically `invalidateQueries` on success to keep cache fresh
- Default query options: staleTime=5min, gcTime=10min, retry=1, refetchOnWindowFocus=false
- Devtools accessible via floating icon (bottom-left) in development

## Key Conventions
- Client components use `'use client'` directive
- API routes in `src/app/api/` follow route handler pattern
- UI components in `src/components/ui/` are generic/reusable
- Shared data constants in `src/data/`
- Storage key constants in `src/lib/storage-keys.ts`
- Shared hooks in `src/hooks/` — each major API resource gets a dedicated file (e.g. `use-completions.ts`, `use-daily.ts`)
- Error boundaries in `src/components/shared/ErrorBoundary.tsx`
- Auth config and handlers in `src/auth.config.ts` and `src/auth.ts`
- Mongoose models in `src/lib/models/`
- Utility functions in `src/lib/utils.ts`

## Common Tasks
- **Adding a roadmap**: Add entry to `src/data/roadmaps.ts` and corresponding storage key in `src/lib/storage-keys.ts`
- **Adding an API route**: Create route handler in `src/app/api/` directory
- **Adding a model**: Create Mongoose schema in `src/lib/models/`
- **Adding a UI component**: Create in `src/components/ui/` following existing patterns (cn() utility, forwardRef for Radix components)
- **Running lint**: `npm run lint`
- **Running typecheck**: `npm run typecheck`

## API Design Guide
All API messages follow this canonical structure:

### Request Envelope
```json
{
  "User": {
    "id": "MAX",
    "password": "MAX1234"
  },
  "Txn": {
    "id": "SHX55d8191214d54ba9be33b14572ba811",
    "ts": "2026-07-02T12:00:00+05:30",
    "type": "Complaint",
    "Note": "COM_PR_DEP3"
  },
  "Channel": "03",
  "APPVer": "2.0.1",
  "Device": {
    "id": "9fca6ca6a612cf6f",
    "TYPE": "MOB",
    "GEOCODE": "91.9819,23.9404",
    "LOCATION": "Thane",
    "OS": "Android",
    "IP": "10.25.205.68",
    "MOBILE": "918104562628"
  },
  "TxnType": "COMPLAINT",
  "SubType": "BENEFICIARY",
  "OrgTxnId": "SHXkyJke6NcnJOZLcOiMnY2090nvbzL2026",
  "OrgTxnDate": "2026-05-28T15:00:02+05:30",
  "ReferenceNumber": "514713000182",
  "reqAdjAmount": "19.00",
  "reqAdjCode": "U008",
  "reqAdjFlag": "PBRB",
  "Issue": "dfgfgdfgdf",
  "Description": "35fghfhfghfghfgh",
  "VirAddr": "",
  "OrgRRN": "514713000182"
}
```
