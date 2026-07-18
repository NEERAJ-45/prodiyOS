# Samundar — API Reference

## Overview

Base URL: `http://localhost:3000/api`

All routes return JSON unless specified otherwise. Errors follow `{ "error": "message" }` with appropriate HTTP status codes.

---

## Authentication (NextAuth v5)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET | Public | NextAuth session/csrf/signin/signout endpoints |
| `/api/auth/[...nextauth]` | POST | Public | Sign-in with `email` + `password` |
| `/api/auth/register` | POST | Public | Create account (`email`, `name`, `password`, optional `role`, `resetPin`) |
| `/api/auth/reset` | POST | Public | Reset password (`email`, `pin`, `newPassword`) |
| `/api/auth/login-streak` | GET | Required | Returns `{ streak, totalLoginDays }` |

**Auth strategy:** JWT via Credentials provider. Brute-force lockout after 5 failed attempts in 15min. Register returns `201` with user object; `409` on duplicate email.

---

## DB Resource Routes `/api/db/*`

User identification via: `?userEmail=` query param, `x-user-email` header, or body field (for writes).

### Completions — `/api/db/completions`

| Method | Description |
|---|---|
| `GET` | List all completions for user |
| `POST` | Toggle completion: send `{ storagePrefix, itemId, completedAt }` to create; omit `completedAt` to delete. Send `{ storagePrefix, resetAll: true }` to clear prefix |

```
GET  → { dbConnected, data: [{ _id, storagePrefix, itemId, completedAt, userEmail }] }
POST → { success, data } | { success, deleted: true }
```

### Notes — `/api/db/notes`

| Method | Description |
|---|---|
| `GET` | List all notes for user |
| `POST` | Upsert: `{ storagePrefix, itemId, note }`. Delete: omit `note`. Reset: `{ storagePrefix, resetAll: true }` |

### Custom Topics — `/api/db/custom-topics`

| Method | Description |
|---|---|
| `GET` | List custom topics |
| `POST` | Create/update: `{ storagePrefix, id, title, difficulty, link? }` |
| `DELETE` | `?storagePrefix=&id=&userEmail=` — delete one or all (`id` omitted = reset prefix) |

### Daily — `/api/db/daily`

| Method | Description |
|---|---|
| `GET` | `?date=YYYY-MM-DD` — get daily record |
| `PUT` | Upsert: `{ date, completedTaskIds?, note? }` |

```
GET  → { dbConnected, record: { _id, date, completedTaskIds, note, userEmail } }
```

### Daily History — `/api/db/daily/history`

| Method | Description |
|---|---|
| `GET` | Last 365 daily records, sorted desc → `{ dbConnected, records: [...] }` |

### Activity — `/api/db/activity`

| Method | Description |
|---|---|
| `GET` | Last 200 activities → `{ activities: [{ text, createdAt }] }` |
| `POST` | Log activity: `{ userEmail, text }` |
| `DELETE` | `?userEmail=` — delete all activities |

### Revision — `/api/db/revision`

| Method | Description |
|---|---|
| `GET` | All revision items |
| `POST` / `PUT` | Create/update: `{ id, concept, stage, dueDate, completed?, userEmail? }` |
| `DELETE` | `?id=&userEmail=` |

### Profile — `/api/db/profile`

| Method | Description |
|---|---|
| `GET` | `?email=` — get profile (password excluded). `?check=true` returns existence only |
| `POST` | Create/update: `{ email, password (SHA-256), name, role?, goals?, mongodbUrl? }` |
| `PATCH` | Update learning status: `{ email, activePillar?, activeCategory?, nextLearningUnit?, nextLearningDuration? }` |

### Resumes — `/api/db/resumes`

| Method | Description |
|---|---|
| `GET` | List resumes (without `pdfData`) |
| `POST` | Create/update: `{ userEmail?, latexSource, title?, company?, pdfData?, id? }` |
| `DELETE` | `?id=` |

### Resume PDF — `/api/db/resumes/pdf/[id]`

| Method | Description |
|---|---|
| `GET` | Download PDF binary → `Content-Type: application/pdf` |

### Command Center — `/api/db/command-center`

| Method | Description |
|---|---|
| `GET` | Aggregated dashboard → `{ dbConnected, stats, focusItems, projects, activities }` |

### Onboarding — `/api/db/onboarding`

| Method | Description |
|---|---|
| `GET` | `?email=` → `{ onboarded, onboardingData }` |
| `POST` | Mark onboarded: `{ email, onboardingData }` |

### Books — `/api/db/books`

| Method | Description |
|---|---|
| `GET` | List books |
| `POST` | Create (JSON or `multipart/form-data` with PDF file) |
| `PUT` | `?id=` — update book |
| `DELETE` | `?id=` |

### Highlights — `/api/db/highlights`

| Method | Description |
|---|---|
| `GET` | `?bookId=&userEmail=` — list highlights for book |
| `POST` | Create: `{ bookId, pageNumber, text?, color?, rects?, userEmail }` |
| `DELETE` | `?id=&userEmail=` |

### Custom Q&A — `/api/db/custom-qa`

| Method | Description |
|---|---|
| `GET` | Q&A data + progress (auth required) |
| `POST` | Actions: `save_data`, `select_book` (slug), `delete_book` (slug), `save_progress` (progress map), `clear` |

### Reset — `/api/db/reset`

| Method | Description |
|---|---|
| `POST` | Factory reset — deletes all user data (completions, activities, projects, revisions, notes, topics, login attempts) and resets profile |

---

## Interview Routes `/api/interviews`

### Applications — `/api/interviews`

| Method | Description |
|---|---|
| `GET` | List all applications sorted by `appliedDate` desc |
| `POST` | Create: `{ userEmail, company, role, appliedDate, status, source, priority, notes?, nextRoundDate?, pdfData? }` |

### Single Application — `/api/interviews/[id]`

| Method | Description |
|---|---|
| `GET` | Get one application by `id` field |
| `PATCH` | Partial update (any fields) |
| `DELETE` | Delete application |

### Reset — `/api/interviews/reset`

| Method | Description |
|---|---|
| `DELETE` | Delete all applications + rounds + companies for user → `{ success, deleted: { applications, rounds, companies } }` |

---

## Company Routes `/api/companies`

### List/Create — `/api/companies`

| Method | Description |
|---|---|
| `GET` | List companies for user (alphabetical) |
| `POST` | Create: `{ userEmail, name, ... }` |

### Single Company — `/api/companies/[id]`

| Method | Description |
|---|---|
| `GET` | Get one company |
| `PATCH` | Partial update |

---

## Round Routes `/api/rounds`

### List/Create — `/api/rounds`

| Method | Description |
|---|---|
| `GET` | `?userEmail=&applicationId=` — list rounds (optional filter by application) |
| `POST` | Create: `{ userEmail, roundType, date, applicationId?, ... }` |

### Single Round — `/api/rounds/[id]`

| Method | Description |
|---|---|
| `PATCH` | Update round |
| `DELETE` | Delete round |

---

## Book PDF Serving

| Route | Method | Description |
|---|---|---|
| `/api/books/[slug]` | GET | Serve static PDF by slug from assets → `Content-Type: application/pdf` |
| `/api/books/read/[id]` | GET | Serve uploaded book PDF by book `id` field → `Content-Type: application/pdf` |

---

## Patterns & LeetCode

### Patterns — `/api/patterns`

| Method | Description |
|---|---|
| `GET` | `?pattern=&page=&pageSize=&search=` — list patterns or problems by pattern |

```
Without pattern → { patterns: [{ key, name, description, easy, medium, hard, total }], total, page, pageSize, totalPages }
With pattern    → { key, name, description, problems: [...], total, page, pageSize, totalPages }
```

### Search — `/api/search`

| Method | Description |
|---|---|
| `GET` | `?q=two+pointer` (min 2 chars) → `{ patterns: [...], problems: [...] }` |

### LeetCode Problem — `/api/leetcode`

| Method | Description |
|---|---|
| `GET` | `?slug=two-sum` — fetch problem description via LeetCode GraphQL → `{ content }` |

---

## LaTeX Compilation

| Route | Method | Description |
|---|---|---|
| `/api/latex/compile` | `POST` | Compile LaTeX to PDF: `{ source }` → binary PDF. Local `pdflatex` with cloud fallback. Max 500KB |

**Errors:** `400` invalid, `413` too large, `422` compile error, `429` rate-limited.

---

## Profile Management

| Route | Method | Description |
|---|---|---|
| `/api/profile/email` | `PATCH` | Change email: `{ currentEmail, newEmail, password }` |

---

## Sync & Health

| Route | Method | Description |
|---|---|---|
| `/api/sync` | `POST` | DB health check → `{ ok, collections: [...], db }` |

---

## Cron

| Route | Method | Description |
|---|---|---|
| `/api/cron/daily-check` | `GET` | `?secret=<CRON_SECRET>` — check daily requirements and send reminder emails |

---

## Models (Mongoose)

| Model | Key Fields |
|---|---|
| `Profile` | `email`, `name`, `password`, `role`, `goals`, `activePillar` |
| `Completion` | `userEmail`, `storagePrefix`, `itemId`, `completedAt` |
| `Note` | `userEmail`, `storagePrefix`, `itemId`, `note` |
| `CustomTopic` | `userEmail`, `storagePrefix`, `id`, `title`, `difficulty`, `link` |
| `DailyRecord` | `userEmail`, `date`, `completedTaskIds`, `note` |
| `Activity` | `userEmail`, `text`, `createdAt` |
| `Revision` | `userEmail`, `id`, `concept`, `stage`, `dueDate`, `completed` |
| `Project` | `userEmail`, `name`, `status`, `description`, `docs`, `technologies` |
| `Book` | `userEmail`, `title`, `author`, `status`, `progress`, `rating`, `pdfPath` |
| `Highlight` | `userEmail`, `bookId`, `pageNumber`, `text`, `color`, `rects` |
| `Application` | `id`, `userEmail`, `company`, `role`, `status`, `pdfData` |
| `InterviewRound` | `userEmail`, `applicationId`, `roundType`, `date`, `notes` |
| `Company` | `userEmail`, `name`, `compRange`, `techStack`, `whyInterested` |
| `LoginAttempt` | `email`, `success`, `timestamp`, `failReason` |
| `CustomQA` | `userEmail`, `activeBookSlug`, `books` |
| `CustomQAProgress` | `userEmail`, `progress` |
| `Resume` | `userEmail`, `title`, `company`, `latexSource`, `pdfData` (Buffer) |
