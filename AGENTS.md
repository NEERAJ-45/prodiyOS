# Samundar — ProdigyOS Learning Tracker

## Project Overview
A full-stack learning progress tracking platform built with Next.js, MongoDB, and Tailwind CSS. Features include DSA problem tracking, learning roadmaps, daily schedule management, spaced-revision system, and analytics dashboard.

## Architecture
- **Framework**: Next.js (App Router)
- **Auth**: NextAuth v5 with Credentials provider, JWT sessions, brute-force lockout
- **Database**: MongoDB via Mongoose (optional, localStorage-first with DB sync)
- **Styling**: Tailwind CSS v4
- **State**: React hooks + localStorage for client state; MongoDB for persistence

## Key Conventions
- Client components use `'use client'` directive
- API routes in `src/app/api/` follow route handler pattern
- UI components in `src/components/ui/` are generic/reusable
- Shared data constants in `src/data/`
- Storage key constants in `src/lib/storage-keys.ts`
- Shared hooks in `src/hooks/`
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
- **Running typecheck**: `npx tsc --noEmit`

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
