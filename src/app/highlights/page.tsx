"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Highlighter, MessageSquare, Search } from "lucide-react";

interface HighlightItem {
  id: string;
  text: string;
  page: string | null;
  location: string | null;
  importedAt: string;
  bookId: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
  _count: { comments: number };
}

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bookFilter, setBookFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/highlights")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHighlights(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const books = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of highlights) {
      map.set(h.book.id, h.book.title);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "de"));
  }, [highlights]);

  const filtered = highlights.filter((h) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      h.text.toLowerCase().includes(q) ||
      h.book.title.toLowerCase().includes(q) ||
      (h.book.author ?? "").toLowerCase().includes(q);
    const matchesBook = bookFilter === "all" || h.book.id === bookFilter;
    return matchesSearch && matchesBook;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Highlights</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Alle markierten Passagen aus deiner Bibliothek
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="In Highlights oder Büchern suchen..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <select
          value={bookFilter}
          onChange={(e) => setBookFilter(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-amber-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="all">Alle Bücher</option>
          {books.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Highlighter size={28} className="mx-auto mb-2 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Keine Highlights gefunden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((h) => (
            <Link
              key={h.id}
              href={`/books/${h.book.id}/highlights/${h.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-zinc-400">
                <span className="truncate font-medium text-zinc-500 dark:text-zinc-300">{h.book.title}</span>
                {h.page && <span>• S. {h.page}</span>}
                {h.location && <span className="truncate">• {h.location}</span>}
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {h.text}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                <span>{new Date(h.importedAt).toLocaleDateString("de-DE")}</span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={12} />
                  {h._count.comments}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
