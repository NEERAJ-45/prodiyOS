"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileType,
  Library,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import books, { type BookEntry, categoryLabels } from "@/data/books";
import { BOOK_CATEGORIES, getCategoryLabel } from "@/data/book-categories";
import {
  BookFormDialog,
  type BookFormState,
} from "@/components/books/BookFormDialog";
import { toast } from "@/components/ui/toast";
import { useAddBook, useBooksQuery, type BookData } from "@/hooks/use-books";

const categoryOrder = [
  "01-Foundations",
  "02-Distributed-Systems",
  "03-Architecture",
  "04-Performance",
  "05-Deep-Mastery",
  "06-Meta-Learning",
];

const bookStatusConfig: Record<
  BookData["status"],
  { label: string; className: string }
> = {
  TO_READ: { label: "To Read", className: "border-border bg-muted text-muted-foreground" },
  READING: { label: "Reading", className: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  COMPLETED: { label: "Completed", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  REFERENCE: { label: "Reference", className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
};

const emptyFormState: BookFormState = {
  title: "",
  author: "",
  category: "system-design",
  status: "TO_READ",
  progress: 0,
  rating: 0,
  pdfFile: null,
};

type SearchHit = {
  key: string;
  title: string;
  author?: string;
  categoryLabel: string;
  status?: { label: string; className: string };
  progress?: number;
  hasPdf?: boolean;
  href: string;
};

function groupBooksByCategory(): Record<string, BookEntry[]> {
  const grouped: Record<string, BookEntry[]> = {};
  for (const book of books) {
    (grouped[book.category] ??= []).push(book);
  }
  return grouped;
}

function groupUploadedBooksByCategory(
  uploadedBooks: BookData[],
): Record<string, BookData[]> {
  const grouped: Record<string, BookData[]> = {};
  for (const book of uploadedBooks) {
    (grouped[book.category || "other"] ??= []).push(book);
  }
  return grouped;
}

function BookCard({
  title,
  author,
  categoryLabel,
  href,
  status,
  progress,
  hasPdf,
}: {
  title: string;
  author?: string;
  categoryLabel: string;
  href: string;
  status?: { label: string; className: string };
  progress?: number;
  hasPdf?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full border-border bg-card/60 transition-colors group-hover:border-primary/40 group-hover:bg-card">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-sm font-medium">{title}</CardTitle>
              {author && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{author}</p>
              )}
            </div>
            {status && (
              <Badge
                variant="outline"
                className={cn("shrink-0 text-[10px]", status.className)}
              >
                {status.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {categoryLabel}
          </p>
          {typeof progress === "number" && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>
          )}
          {hasPdf && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileType className="h-3 w-3" />
              PDF
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function LibraryPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<BookFormState>(emptyFormState);
  const { data: booksData, isLoading } = useBooksQuery();
  const addBook = useAddBook();

  const grouped = React.useMemo(() => groupBooksByCategory(), []);
  const uploadedBooks = React.useMemo(() => booksData?.books ?? [], [booksData]);
  const q = searchQuery.toLowerCase().trim();

  const uploadedGrouped = React.useMemo(
    () => groupUploadedBooksByCategory(uploadedBooks),
    [uploadedBooks],
  );

  const searchResults = React.useMemo<SearchHit[]>(() => {
    if (!q) return [];

    const uploadedHits: SearchHit[] = uploadedBooks
      .filter((book) => {
        const title = book.title.toLowerCase();
        const author = (book.author || "").toLowerCase();
        return title.includes(q) || author.includes(q);
      })
      .map((book) => {
        const hasPdf = !!(book.hasPdf || book.pdfPath);
        return {
          key: `uploaded-${book._id || book.id}`,
          title: book.title,
          author: book.author || undefined,
          categoryLabel: getCategoryLabel(book.category || "other"),
          status: bookStatusConfig[book.status],
          progress: book.progress,
          hasPdf,
          href: hasPdf ? `/books/read/${book.id}` : `/books/reading/${book.id}`,
        };
      });

    const staticHits: SearchHit[] = books
      .filter((book) => book.title.toLowerCase().includes(q))
      .map((book) => ({
        key: `static-${book.slug}`,
        title: book.title,
        categoryLabel: categoryLabels[book.category] || book.category,
        hasPdf: true,
        href: `/books/${book.slug}`,
      }));

    return [...uploadedHits, ...staticHits];
  }, [q, uploadedBooks]);

  function openAddDialog() {
    setForm(emptyFormState);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("author", form.author.trim());
    formData.append("category", form.category);
    formData.append("status", form.status);
    formData.append("progress", String(form.progress));
    formData.append("rating", String(form.rating));
    if (form.pdfFile) {
      formData.append("pdf", form.pdfFile);
    }

    addBook.mutate(formData as unknown as FormData, {
      onSuccess: () => {
        toast({ title: "Book added" });
        setDialogOpen(false);
      },
      onError: () =>
        toast({ variant: "destructive", title: "Failed to add book" }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Library</h2>
          <p className="text-sm text-muted-foreground">
            {uploadedBooks.length} uploaded · {books.length} built-in
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openAddDialog}
            className="shrink-0"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Book
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : q ? (
        searchResults.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {searchResults.length}{" "}
              {searchResults.length === 1 ? "result" : "results"} for &quot;
              {searchQuery.trim()}&quot;
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map(({ key, ...hit }) => (
                <BookCard key={key} {...hit} />
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-border bg-card/40">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">No books match your search</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different title or author
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <>
          {Object.keys(uploadedGrouped).length > 0 ? (
            <div className="space-y-6">
              {BOOK_CATEGORIES.map((category) => {
                const list = uploadedGrouped[category.value];
                if (!list?.length) return null;

                return (
                  <section key={category.value} className="space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-medium">
                        {getCategoryLabel(category.value)}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {list.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((book) => {
                        const hasPdf = !!(book.hasPdf || book.pdfPath);
                        return (
                          <BookCard
                            key={book._id || book.id}
                            title={book.title}
                            author={book.author || undefined}
                            categoryLabel={getCategoryLabel(book.category || "other")}
                            status={bookStatusConfig[book.status]}
                            progress={book.progress}
                            hasPdf={hasPdf}
                            href={
                              hasPdf
                                ? `/books/read/${book.id}`
                                : `/books/reading/${book.id}`
                            }
                          />
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <Card className="border-border bg-card/40">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">No uploaded books yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use Add Book to upload a PDF into the matching category
                </p>
              </CardContent>
            </Card>
          )}

          {selectedCategory ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to categories
              </button>
              <div>
                <h3 className="text-lg font-semibold">
                  {categoryLabels[selectedCategory] || selectedCategory}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {(grouped[selectedCategory] || []).length} books
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(grouped[selectedCategory] || []).map((book) => (
                  <BookCard
                    key={book.slug}
                    title={book.title}
                    categoryLabel={categoryLabels[book.category] || book.category}
                    hasPdf
                    href={`/books/${book.slug}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Built-in library</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {categoryOrder.map((cat) => {
                  const catBooks = grouped[cat];
                  if (!catBooks) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="group text-left"
                    >
                      <Card className="h-full border-border bg-card/60 transition-colors group-hover:border-primary/40 group-hover:bg-card">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                            <Library className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {categoryLabels[cat] || cat}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {catBooks.length}{" "}
                              {catBooks.length === 1 ? "book" : "books"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <BookFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="add"
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        isPending={addBook.isPending}
      />
    </div>
  );
}
