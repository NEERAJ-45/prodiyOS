# Technology Stack

**Analysis Date:** 2026-07-18

## Languages

**Primary:**
- TypeScript 5.x - Used across the entire codebase: frontend components, server-side API routes, shared libraries, and test files
- JavaScript (ESNext) - Configuration files (`postcss.config.mjs`, `eslint.config.mjs`, `next.config.ts`, `tailwind.config.ts`)

**Secondary:**
- LaTeX - Resume compilation via `pdflatex` binary or cloud API (`src/app/api/latex/compile/route.ts`)
- CSS (Tailwind) - Styling via utility classes in the Tailwind CSS framework

## Runtime

**Environment:**
- Node.js (via Next.js 16.2.9 server runtime)
- Package Manager: npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.9 (App Router) - Full-stack React framework for server-side rendering, API routes, and page routing
- React 19.2.4 - UI component library
- Tailwind CSS ^3.4.19 - Utility-first CSS framework (via `tailwind.config.ts` and `postcss.config.mjs`)
  - Note: package.json lists `tailwindcss@^3.4.19` in devDependencies while AGENTS.md mentions "Tailwind CSS v4" — package.json is the source of truth (v3)

**Testing:**
- Vitest ^4.1.9 - Test runner (config in `vitest.config.ts`)
- @testing-library/react ^16.3.2 - React component testing utilities
- @testing-library/jest-dom ^6.9.1 - DOM-specific matchers for Jest/Vitest
- jsdom ^29.1.1 - DOM environment for tests
- @vitejs/plugin-react ^6.0.3 - Vite plugin for React transform in tests

**Build/Dev:**
- TypeScript 5.x - Type checking via `tsc --noEmit` (`npm run typecheck`)
- ESLint 9.x - Linting (config in `eslint.config.mjs` with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`)
- PostCSS ^8.5.16 with autoprefixer ^10.5.2 and postcss-import ^16.1.1 - CSS processing pipeline
- Turbopack - Next.js dev bundler enabled in `next.config.ts`

## Key Dependencies

**Critical:**
- `next@16.2.9` — Full-stack framework; app router, server actions, API routes, SSR/SSG
- `next-auth@^5.0.0-beta.31` — Authentication with Credentials provider and JWT sessions
- `mongoose@^9.7.1` — MongoDB ODM for schema-based data modeling and database connectivity
- `@tanstack/react-query@^5.101.0` — Server state management for all HTTP API calls
- `react@19.2.4` / `react-dom@19.2.4` — Core UI library
- `bcrypt-ts@^8.0.1` — Password hashing in auth flows (works in Edge/serverless)
- `zustand@^5.0.14` — Lightweight state management for client-side stores (`mode-store.ts`)
- `zod@^4.4.3` — Schema validation for forms and API payloads (`src/lib/schemas/interview.ts`)
- `resend@^6.16.0` — Email sending service (daily reminder cron job)

**UI & Styling:**
- `@radix-ui/react-*` (avatar, dialog, dropdown-menu, label, progress, scroll-area, select, separator, slot, switch, tabs, tooltip) — Accessible headless UI primitives
- `tailwind-merge@^3.6.0` — Utility for merging Tailwind class names (used with `cn()` helper)
- `class-variance-authority@^0.7.1` — Component variant management (likely in `src/components/ui/`)
- `clsx@^2.1.1` — Conditional class name construction
- `lucide-react@^1.21.0` — Icon library
- `framer-motion@^12.40.0` — Animation library for transitions and boot screen
- `gsap@^3.15.0` — Animation library (GreenSock) for advanced animations

**Forms & Data:**
- `react-hook-form@^7.79.0` — Form state management
- `@hookform/resolvers@^5.4.0` — Zod resolver integration for react-hook-form
- `@tanstack/react-table@^8.21.3` — Headless table library for data grids
- `recharts@^3.8.1` — Charting library for analytics dashboards

**Document & File Handling:**
- `react-pdf@^10.4.1` — PDF rendering in the browser
- `react-reader@^2.0.15` — ePub reader component
- `@cyntler/react-doc-viewer@^1.17.1` — Multi-format document viewer
- `cmdk@^1.1.1` — Command menu / quick search component
- `react-hot-toast@^2.6.0` — Toast notification system

**Drag & Drop:**
- `@dnd-kit/core@^6.3.1` — Drag-and-drop toolkit
- `@dnd-kit/utilities@^3.2.2` — DnD utilities

**Date Handling:**
- `date-fns@^4.4.0` — Date utility library

**Infrastructure:**
- `node-latex@^3.1.0` — Node.js LaTeX compilation (legacy/existing, but compilation uses `pdflatex` spawn directly via `child_process`)
- `autoprefixer@^10.5.2` — PostCSS plugin for vendor prefixes

## Configuration

**Environment:**
- `.env.local` file present - contains environment configuration
- Required env vars:
  - `AUTH_SECRET` — NextAuth.js encryption secret for JWT
  - `MONGODB_URI_HOME` — MongoDB Atlas connection string (home mode)
  - `MONGODB_URI_OFFICE` — MongoDB local connection string (office mode)
  - `MONGODB_URI` — Fallback MongoDB connection string
  - `CRON_SECRET` — Secret for Vercel Cron Job endpoint (`/api/cron/daily-check`)
  - `RESEND_API_KEY` — Resend API key for email sending
  - `EMAIL_FROM` — Sender email address for outgoing emails (default: `noreply@prodigyos.app`)

**Build:**
- `tsconfig.json` — TypeScript config targeting ES2017, strict mode, bundler module resolution, `@/*` path alias mapping to `./src/*`
- `next.config.ts` — Server external packages (`fs`), turbopack, experimental server actions with 50MB body limit, `outputFileTracingIncludes` for book assets
- `tailwind.config.ts` — Custom HSL color tokens, border radius, shimmer animation keyframes
- `postcss.config.mjs` — PostCSS with tailwindcss and autoprefixer plugins
- `eslint.config.mjs` — ESLint flat config with Next.js core-web-vitals + TypeScript rules

## Platform Requirements

**Development:**
- Node.js 18+ (Next.js 16.2.9 requirement)
- npm (for dependency management)
- MongoDB (Atlas or local instance) accessible via connection string
- LaTeX distribution (`pdflatex` binary) for local resume compilation (optional; falls back to cloud API)

**Production:**
- Vercel (deployment target — `vercel.json` configures cron job and deployment settings)
- MongoDB Atlas (primary database)
- Resend API key configured for email functionality
- Cron job endpoint protected by `CRON_SECRET`

---

*Stack analysis: 2026-07-18*
