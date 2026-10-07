# Library Page Ideas

## 1. Flat search results (implemented)

**Problem:** Searching on `/books/library` was terrible — results stayed grouped by
category headers (uploaded section) and category cards (static library), and the
category drill-down ignored the query entirely, so you had to click through groups
to find a match.

**Solution:** When the search box has a query, replace the whole page body with a
single flat grid of matching book cards:

- Uploaded books match on title or author; static library books match on title.
- One merged result list — no category groups, no category cards, no drill-down.
- Each card shows title, author (if any), status badge (uploaded) or category
  label, and links to the book's reader.
- Result count header: `12 results for "java"`.
- Empty state: "No books match your search".
- Clearing the search restores the normal grouped/category view.

**Status:** Implemented in `src/app/(dashboard)/books/library/page.tsx`
(commit `b67d515`).

## 2. Merge uploaded books into the 7 library categories (pending)

**Problem:** Uploaded books render in a completely separate "Uploaded books"
section (summary card + grouped sections) above the static library, using a
different category taxonomy. The page feels like two disjoint apps.

**Decision:** Map uploaded categories onto the 7 static library categories so
everything renders as one unified category grid:

| Uploaded category      | Maps to                |
| ---------------------- | ---------------------- |
| `system-design`        | `03-Architecture`      |
| `architecture`         | `03-Architecture`      |
| `databases`            | `02-Distributed-Systems` |
| `devops`               | `04-Performance`       |
| `languages`            | `01-Foundations`       |
| `dsa`                  | `07-Others`            |
| `soft-skills`          | `07-Others`            |
| `other`                | `07-Others`            |

**Design:**

- Remove the "Uploaded books" summary card and its grouped sections entirely.
- Category cards show combined counts (static + uploaded).
- Category drill-down lists both sources together; uploaded books keep their
  status badge, author, and link to `/books/read/:id` or `/books/reading/:id`.
- Static books keep their existing links (`/books/:slug`) and PDF marker.
- Search behavior from idea 1 stays unchanged.

**Status:** Approved, not yet implemented.
