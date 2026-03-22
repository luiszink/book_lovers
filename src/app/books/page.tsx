"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Search, RefreshCw } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  _count: { highlights: number };
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);

  const loadBooks = () =>
    fetch("/api/books")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBooks(data); });

  useEffect(() => {
    loadBooks().finally(() => setLoading(false));
  }, []);

  const refreshCovers = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await fetch("/api/books/refresh-covers", { method: "POST" });
      const data = await res.json();
      setRefreshResult(`${data.updated} von ${data.total} Covern aktualisiert`);
      await loadBooks();
    } catch {
      setRefreshResult("Fehler beim Aktualisieren");
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Bibliothek
        </h1>
        <button
          onClick={refreshCovers}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-amber-300 hover:text-amber-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Cover aktualisieren
        </button>
      </div>

      {refreshResult && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          {refreshResult}
        </p>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          placeholder="Suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <BookOpen
            size={48}
            className="mx-auto mb-4 text-zinc-300 dark:text-zinc-600"
          />
          <p className="font-medium text-zinc-600 dark:text-zinc-400">
            {search ? "Keine Ergebnisse" : "Noch keine Bücher"}
          </p>
          {!search && (
            <Link
              href="/import"
              className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Highlights importieren
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-amber-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Cover */}
              <div className="relative h-40 bg-zinc-100 dark:bg-zinc-800">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen size={36} className="text-zinc-300 dark:text-zinc-600" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{book.author}</p>
                )}
                <p className="mt-auto pt-2 text-xs text-zinc-400">
                  {book._count.highlights} Highlights
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

