# Black Matte UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the whole Samundar UI to a true-black, zero-chroma matte finish with muted semantic accents and no gloss (no gradients, backdrop blur, or elevation shadows).

**Architecture:** One token-layer change carries the palette: override the `zinc` scale and the heavy-used accent shades in `tailwind.config.ts`, and rewrite the HSL variables + utilities in `globals.css`. That recolors the ~1,500 existing `zinc-*` class usages without touching every file. Then a small, explicit polish pass removes gloss from shared primitives, app chrome, feature surfaces, and the MUI-based docs/files viewers.

**Tech Stack:** Next.js 16 (App Router), React, Tailwind CSS 3.4, MUI (docs/files only), TypeScript.

## Global Constraints

- Single dark theme only; no light mode. `dark` class stays on `<html>`.
- Matte palette (exact values):
  - `zinc-50 #f7f7f7`, `100 #ededed`, `200 #d6d6d6`, `300 #b0b0b0`, `400 #8a8a8a`, `500 #6c6c6c`, `600 #535353`, `700 #333333`, `800 #1e1e1e`, `900 #141414`, `950 #0a0a0a`
  - CSS vars: `--background 0 0% 4%`, `--foreground 0 0% 93%`, `--card 0 0% 8%`, `--popover 0 0% 8%`, `--primary 0 0% 92%`, `--primary-foreground 0 0% 7%`, `--secondary 0 0% 11%`, `--muted 0 0% 11%`, `--muted-foreground 0 0% 56%`, `--accent 0 0% 13%`, `--border 0 0% 13%`, `--input 0 0% 17%`, `--destructive 0 45% 38%`, `--ring 233 30% 58%`
- Accent policy: keep semantic colors, desaturate. Only override the shades actually used.
- Zero `backdrop-blur-*`, zero `bg-gradient-*`, zero `shadow-{sm,md,lg,xl,2xl}` on UI surfaces after the pass. Overlays may keep `bg-black/60`–`/80` dim without blur.
- Accent text on `#0a0a0a` must stay ≥ 4.5:1 contrast. The muted values below meet this.
- No behavior, layout, spacing, or copy changes. Styling only.
- Verify with `npm run lint`, `npm run typecheck`, `npm run build`.

---

### Task 1: Palette foundation

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: global matte tokens consumed by every existing `zinc-*` / accent class and by `bg-background`, `border-border`, `bg-card`, etc.

- [ ] **Step 1: Add the matte color overrides**

In `tailwind.config.ts`, replace the opening of `theme.extend.colors` (currently `background: 'hsl(var(--background))',`) so the block begins with the matte overrides, then keeps the existing semantic entries unchanged:

```ts
colors: {
  zinc: {
    50: '#f7f7f7', 100: '#ededed', 200: '#d6d6d6', 300: '#b0b0b0',
    400: '#8a8a8a', 500: '#6c6c6c', 600: '#535353', 700: '#333333',
    800: '#1e1e1e', 900: '#141414', 950: '#0a0a0a',
  },
  emerald: {
    100: '#cfe6dc', 200: '#b0d4c5', 300: '#86c4ab', 400: '#5fae90',
    500: '#4b9478', 600: '#3d7a63', 700: '#2f6350', 800: '#1b3b2e',
    900: '#12291f', 950: '#0c1f19',
  },
  red: {
    100: '#efd0d0', 200: '#ecc4c4', 300: '#e6b3b3', 400: '#d98b8b',
    500: '#b96a6a', 600: '#a55a5a', 700: '#8f4a4a', 800: '#3f1e1e',
    900: '#2c1414', 950: '#240f0f',
  },
  amber: {
    100: '#f6e8cc', 200: '#efdcb4', 300: '#e3c48c', 400: '#d4ad62',
    500: '#b8924c', 600: '#a17f3f', 700: '#8c6e35', 800: '#3a2d15',
    900: '#2b2110', 950: '#211a0c',
  },
  indigo: {
    100: '#d5d9ef', 200: '#bcc3e6', 300: '#adb6df', 400: '#8b98cf',
    500: '#6c7cc0', 600: '#5a67a8', 700: '#4b568f', 800: '#2a3054',
    900: '#1d2340', 950: '#12142b',
  },
  blue: {
    100: '#d3dfef', 200: '#bfd0e8', 300: '#a8bfe0', 400: '#7d9dd1',
    500: '#5f82ba', 600: '#4f6d9f', 700: '#405a83', 800: '#21314f',
    900: '#18243a', 950: '#101a2b',
  },
  purple: {
    100: '#e2d5ee', 200: '#d5c3e6', 300: '#c9b2dd', 400: '#ab8cc9',
    500: '#916fb1', 600: '#7a5c96', 700: '#664c7e', 800: '#3c2a4e',
    900: '#2a1d37', 950: '#1a1224',
  },
  cyan: {
    100: '#cfe6ea', 200: '#b8d8de', 300: '#9bcbd4', 400: '#6fb2bf',
    500: '#4f9aaa', 600: '#42808d', 700: '#376b76', 800: '#174049',
    900: '#112f36', 950: '#0c1c20',
  },
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: 'hsl(var(--card))',
  'card-foreground': 'hsl(var(--card-foreground))',
  popover: 'hsl(var(--popover))',
  'popover-foreground': 'hsl(var(--popover-foreground))',
  primary: 'hsl(var(--primary))',
  'primary-foreground': 'hsl(var(--primary-foreground))',
  secondary: 'hsl(var(--secondary))',
  'secondary-foreground': 'hsl(var(--secondary-foreground))',
  muted: 'hsl(var(--muted))',
  'muted-foreground': 'hsl(var(--muted-foreground))',
  accent: 'hsl(var(--accent))',
  'accent-foreground': 'hsl(var(--accent-foreground))',
  destructive: 'hsl(var(--destructive))',
  'destructive-foreground': 'hsl(var(--destructive-foreground))',
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
},
```

- [ ] **Step 2: Rewrite the root variables**

In `src/app/globals.css`, replace the `:root` block (lines 6–27) with:

```css
:root {
  --background: 0 0% 4%;
  --foreground: 0 0% 93%;
  --card: 0 0% 8%;
  --card-foreground: 0 0% 93%;
  --popover: 0 0% 8%;
  --popover-foreground: 0 0% 93%;
  --primary: 0 0% 92%;
  --primary-foreground: 0 0% 7%;
  --secondary: 0 0% 11%;
  --secondary-foreground: 0 0% 93%;
  --muted: 0 0% 11%;
  --muted-foreground: 0 0% 56%;
  --accent: 0 0% 13%;
  --accent-foreground: 0 0% 93%;
  --destructive: 0 45% 38%;
  --destructive-foreground: 0 0% 93%;
  --border: 0 0% 13%;
  --input: 0 0% 17%;
  --ring: 233 30% 58%;
  --radius: 0.5rem;
}
```

- [ ] **Step 3: Flatten utilities and native chrome**

In the same file:

Replace the `.card-hover` block (lines 50–58) with:

```css
.card-hover {
  @apply transition-colors duration-200;
}

.card-hover:hover {
  @apply border-zinc-700;
}
```

Replace the selection rule (line 33–35) with:

```css
::selection {
  @apply bg-white/15 text-foreground;
}
```

Replace the scrollbar thumb rules (lines 69–75) with:

```css
::-webkit-scrollbar-thumb {
  @apply bg-zinc-800 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-zinc-700;
}
```

Replace the emoji-mart block (lines 86–95) with:

```css
em-emoji-picker {
  --rgb-background: 20, 20, 20;
  --rgb-input: 30, 30, 30;
  --rgb-color: 214, 214, 214;
  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-over: rgba(255, 255, 255, 0.12);
  height: auto !important;
  max-height: 100% !important;
}
```

- [ ] **Step 4: Verify the token layer builds**

Run: `npm run typecheck`
Expected: PASS, no errors.

Run: `npm run build`
Expected: compiled successfully.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat(ui): matte black color system and flat utilities"
```

---

### Task 2: Flat shared primitives

**Files:**
- Modify: `src/components/ui/card.tsx:15`
- Modify: `src/components/ui/dialog.tsx:40`
- Modify: `src/components/ui/sheet.tsx:37`
- Modify: `src/components/ui/dropdown-menu.tsx:49,67`
- Modify: `src/components/ui/select.tsx:77`
- Modify: `src/components/ui/tooltip.tsx:21`
- Modify: `src/components/ui/toast.tsx:38,81`
- Modify: `src/components/ui/quote-toast.tsx:17`

**Interfaces:**
- Consumes: matte tokens from Task 1.
- Produces: flat card/dialog/menu/toast components reused app-wide. No API or prop changes.

- [ ] **Step 1: Flatten Card**

In `src/components/ui/card.tsx`, change the Card `className` to:

```tsx
'rounded-lg border bg-card text-card-foreground transition-colors duration-200 hover:border-zinc-700'
```

- [ ] **Step 2: Remove elevation from overlays and menus**

Apply these exact replacements:

- `src/components/ui/dialog.tsx` line 40: remove ` shadow-lg` (keep `border bg-background p-6`).
- `src/components/ui/sheet.tsx` line 37: remove ` shadow-xl`.
- `src/components/ui/dropdown-menu.tsx` lines 49 and 67: remove ` shadow-lg` / ` shadow-md`.
- `src/components/ui/select.tsx` line 77: remove ` shadow-md`.
- `src/components/ui/tooltip.tsx` line 21: remove ` shadow-md`.

- [ ] **Step 3: Make toasts opaque and flat**

In `src/components/ui/toast.tsx`:

- Line 38: `bg: 'bg-zinc-900/95',` → `bg: 'bg-zinc-900',`
- Line 81: `${t.visible ? 'toast-enter' : 'toast-exit'} flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md ${` → `${t.visible ? 'toast-enter' : 'toast-exit'} flex items-start gap-3 rounded-xl border px-4 py-3 ${`

In `src/components/ui/quote-toast.tsx` line 17: replace `bg-zinc-900/95` with `bg-zinc-900` and remove ` shadow-lg`.

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/card.tsx src/components/ui/dialog.tsx src/components/ui/sheet.tsx src/components/ui/dropdown-menu.tsx src/components/ui/select.tsx src/components/ui/tooltip.tsx src/components/ui/toast.tsx src/components/ui/quote-toast.tsx
git commit -m "feat(ui): flat matte primitives without blur or elevation"
```

---

### Task 3: App chrome

**Files:**
- Modify: `src/components/layout/navbar.tsx:36,123`
- Modify: `src/components/layout/sidebar.tsx:183`
- Modify: `src/components/layout/mobile-nav.tsx:94`
- Modify: `src/components/shared/GlobalSearch.tsx:131`
- Modify: `src/components/onboarding/OnboardingWizard.tsx:128`

**Interfaces:**
- Consumes: matte tokens.
- Produces: opaque, flat navigation and overlay chrome.

- [ ] **Step 1: Make the navbar opaque**

In `src/components/layout/navbar.tsx` line 36, replace:

```tsx
<header className="sticky top-0 z-30 flex h-14 w-full justify-center border-b border-border bg-background/80 backdrop-blur-md shrink-0 shadow-[0_1px_0_0_hsl(var(--border)_/_0.4)]">
```

with:

```tsx
<header className="sticky top-0 z-30 flex h-14 w-full justify-center border-b border-border bg-background shrink-0">
```

- [ ] **Step 2: Remove the profile modal gloss**

In the same file, line 123, replace `className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 p-6 backdrop-blur-sm transition-all duration-300 shadow-2xl"` with `className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-6"`.

- [ ] **Step 3: Remove remaining chrome gloss**

Apply these exact replacements:

- `src/components/layout/sidebar.tsx` line 183: remove ` shadow-sm` from the collapse toggle classes.
- `src/components/layout/mobile-nav.tsx` line 94: remove ` backdrop-blur-sm`.
- `src/components/shared/GlobalSearch.tsx` line 131: remove ` backdrop-blur-sm`.
- `src/components/onboarding/OnboardingWizard.tsx` line 128: `bg-zinc-950/95 backdrop-blur-sm` → `bg-zinc-950`.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: PASS.

Run: `grep -rn "backdrop-blur" src/components/layout src/components/shared/GlobalSearch.tsx src/components/onboarding`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/navbar.tsx src/components/layout/sidebar.tsx src/components/layout/mobile-nav.tsx src/components/shared/GlobalSearch.tsx src/components/onboarding/OnboardingWizard.tsx
git commit -m "feat(ui): opaque flat navbar and chrome"
```

---

### Task 4: Feature surfaces and inline colors

**Files:**
- Modify: `src/components/chat/ChatThread.tsx:304`
- Modify: `src/components/chat/MessageBubble.tsx:97`
- Modify: `src/components/interview/CustomQAViewer.tsx:553`
- Modify: `src/components/resume/ats-analyzer.tsx:207`
- Modify: `src/components/resume/humanizer.tsx:63`
- Modify: `src/app/(dashboard)/roadmaps/page.tsx:159`
- Modify: `src/app/(dashboard)/roadmaps/frontend/javascript/page.tsx:209`
- Modify: `src/app/(dashboard)/command-center/activity-chart.tsx`
- Modify: `src/app/(dashboard)/command-center/page.tsx`
- Modify: `src/components/shared/BoltLoader.tsx`

**Interfaces:**
- Consumes: matte tokens.
- Produces: no visual gloss on chat, interview, resume, roadmap cards, command center, or the loader.

- [ ] **Step 1: Remove blur and shadows from feature surfaces**

Apply these exact replacements:

- `src/components/chat/MessageBubble.tsx` line 97: remove `shadow-sm backdrop-blur-sm`.
- `src/components/interview/CustomQAViewer.tsx` line 553: remove `backdrop-blur-sm`.
- `src/components/resume/ats-analyzer.tsx` line 207: remove `backdrop-blur-sm`.
- `src/components/resume/humanizer.tsx` line 63: remove `backdrop-blur-sm`.
- `src/app/(dashboard)/roadmaps/page.tsx` line 159: remove `backdrop-blur-sm`.
- `src/app/(dashboard)/roadmaps/frontend/javascript/page.tsx` line 209: remove `backdrop-blur-md`.
- `src/components/chat/ChatThread.tsx` line 304: replace `bg-gradient-to-br from-primary to-primary/60` with `bg-zinc-800 border border-zinc-700`.

- [ ] **Step 2: Recolor the command-center chart**

In `src/app/(dashboard)/command-center/activity-chart.tsx`, apply this hex mapping:

- `#E1DCC9` → `#d6d6d6`
- `#B9A98C` → `#8a8a8a`
- `#2C2C2C` → `#262626`
- `#919191` → `#8a8a8a`
- `#484848` → `#3a3a3a`
- `#222222` → `#1a1a1a`
- `#000000` → `#0a0a0a`

In `src/app/(dashboard)/command-center/page.tsx`, replace every `#E1DCC9` with `#d6d6d6`.

- [ ] **Step 3: Matte the bolt loader**

In `src/components/shared/BoltLoader.tsx`, apply this hex mapping:

- `#050505` → `#0a0a0a`
- `#262626` → `#1e1e1e`
- `#171717` → `#141414`
- `#FACC15` → `#d4ad62`
- `#FDE68A` → `#e3c48c`
- `#71717a` → `#6c6c6c`
- `#fafafa` → `#d6d6d6`
- `#a1a1aa` → `#8a8a8a`

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: PASS.

Run: `grep -rn "backdrop-blur\|bg-gradient" src/components/chat src/components/interview src/components/resume "src/app/(dashboard)/roadmaps"`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat src/components/interview/CustomQAViewer.tsx src/components/resume src/app/\(dashboard\)/roadmaps src/app/\(dashboard\)/command-center src/components/shared/BoltLoader.tsx
git commit -m "feat(ui): matte feature surfaces and chart colors"
```

---

### Task 5: Docs and files viewers (MUI)

**Files:**
- Modify: `src/components/files/theme.ts`
- Modify: `src/components/files/file-chrome.tsx`
- Modify: `src/components/files/file-manager.tsx`
- Modify: `src/components/files/pdf-dock.tsx`
- Modify: `src/components/files/process-panel.tsx`
- Modify: `src/app/(reader)/docs/preview/[id]/page.tsx:77,78,169,182`

**Interfaces:**
- Consumes: matte palette values.
- Produces: matte MUI docs theme and matte file-manager chrome. No component API changes.

- [ ] **Step 1: Matte the MUI theme**

In `src/components/files/theme.ts`, apply these replacements:

- `primary: { main: '#e95420' }` → `primary: { main: '#c25a33' }`
- `secondary: { main: '#9a9996' }` → `secondary: { main: '#8a8a8a' }`
- `background: { default: '#2b2b2b', paper: '#303030' }` → `background: { default: '#0a0a0a', paper: '#141414' }`
- `text: { primary: '#deddda', secondary: '#9a9996' }` → `text: { primary: '#d6d6d6', secondary: '#8a8a8a' }`
- `divider: '#1b1b1b'` → `divider: '#232323'`
- `error: { main: '#e01b24' }` → `error: { main: '#b96a6a' }`
- `hover: 'rgba(255,255,255,0.07)'` → `hover: 'rgba(255,255,255,0.05)'`
- `selected: 'rgba(233,84,32,0.25)'` → `selected: 'rgba(194,90,51,0.18)'`
- Scrollbar thumb `background: '#555'` → `'#3a3a3a'`; scrollbar border `'2px solid #2b2b2b'` → `'2px solid #0a0a0a'`
- `MuiMenu` paper `backgroundColor: '#383838'` → `'#1e1e1e'`; `border: '1px solid #1b1b1b'` → `'1px solid #232323'`; `boxShadow` → delete the line.
- `MuiDialog` paper `backgroundColor: '#303030'` → `'#141414'`; border → `'1px solid #232323'`.
- `MuiTableCell` `borderColor: '#1b1b1b'` → `'#232323'`; head `backgroundColor: '#262626', color: '#9a9996'` → `'#1a1a1a'`, `'#8a8a8a'`.

- [ ] **Step 2: Convert the Ubuntu hexes in files components**

Apply this mapping to every matching hex in `file-chrome.tsx`, `file-manager.tsx`, `pdf-dock.tsx`, and `process-panel.tsx`:

- `#e95420` → `#c25a33`
- `#1b1b1b` → `#101010`
- `#262626` → `#1a1a1a`
- `#2b2b2b` → `#0f0f0f`
- `#303030` → `#141414`
- `#383838` → `#1f1f1f`
- `#9a9996` → `#8a8a8a`
- `#deddda` → `#d6d6d6`
- `#E1DCC9` → `#d6d6d6`
- `#222222` → `#1a1a1a`

- [ ] **Step 3: Matte the docs preview page**

In `src/app/(reader)/docs/preview/[id]/page.tsx`:

- Line 77: `bg-[#1b1b1b]` → `bg-[#101010]`
- Line 78: `bg-[#262626]` → `bg-[#1a1a1a]`
- Line 169: `bg-[#1b1b1b]` → `bg-[#101010]`
- Line 182: `bg-[#262626]` → `bg-[#1a1a1a]`

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: PASS.

Run: `grep -rn "#e95420\|#E1DCC9\|#1b1b1b\|#2b2b2b\|#303030\|#383838" src/components/files "src/app/(reader)/docs"`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/files "src/app/(reader)/docs/preview/[id]/page.tsx"
git commit -m "feat(ui): matte docs and files viewers"
```

---

### Task 6: Sweep and final verification

**Files:**
- Modify: any file reported by the sweep greps below.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified, gloss-free build.

- [ ] **Step 1: Run the gloss gate**

Run:

```bash
grep -rn "backdrop-blur\|bg-gradient-to\|shadow-sm\|shadow-md\|shadow-lg\|shadow-xl\|shadow-2xl" src
```

Expected: no output. Fix every hit with the same rules as Tasks 2–5 (delete the blur/shadow/gradient class; use flat `border` for separation).

- [ ] **Step 2: Run the warm-hex gate**

Run:

```bash
grep -rn "#[eE]95420\|#E1DCC9\|#B9A98C\|#FACC15\|#FDE68A\|#1b1b1b\|#2b2b2b\|#303030\|#383838\|#9a9996\|#deddda" src
```

Expected: no output. Apply the Task 5 mapping to any hit.

- [ ] **Step 3: Run the quality gates**

Run: `npm run lint`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run build`
Expected: compiled successfully.

- [ ] **Step 4: Visual sanity pass**

Start `npm run dev` and check these routes render matte black with no glassy panels or glowing cards:

- `/` and `/login`
- `/command-center`
- `/roadmaps` and `/roadmaps/frontend/react`
- `/patterns`, `/focus`, `/daily`
- `/chat`
- `/files`
- `/docs` and a `/docs/preview/[id]` page
- `/books/read/[id]` and `/docs/read/[id]`
- Open the navbar profile modal, a dialog, a dropdown, a select, and a toast

Confirm text is readable on every surface and status colors still read as green/red/amber/indigo.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(ui): sweep remaining gloss in black matte pass"
```
