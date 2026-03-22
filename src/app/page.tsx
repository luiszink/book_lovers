"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  MessageSquare,
  Upload,
  Users,
  TrendingUp,
  Library,
} from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  _count: { highlights: number };
}

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/books")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBooks(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalHighlights = books.reduce((s, b) => s + b._count.highlights, 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Willkommen zurück
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Deine Lese-Übersicht auf einen Blick
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Library size={16} className="text-amber-500" />
            <span className="text-xs font-medium text-zinc-500">Bücher</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
            {loading ? "–" : books.length}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500" />
            <span className="text-xs font-medium text-zinc-500">Highlights</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
            {loading ? "–" : totalHighlights}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-zinc-500">Avg/Buch</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
            {loading || books.length === 0
              ? "–"
              : Math.round(totalHighlights / books.length)}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <Link
          href="/import"
          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 transition-colors hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
            <Upload size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Import
            </p>
            <p className="text-[11px] text-zinc-500">My Clippings.txt</p>
          </div>
        </Link>

        <Link
          href="/books"
          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 transition-colors hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
            <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Bibliothek
            </p>
            <p className="text-[11px] text-zinc-500">{books.length} Bücher</p>
          </div>
        </Link>

        <Link
          href="/groups"
          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 transition-colors hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
            <Users size={18} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Gruppen
            </p>
            <p className="text-[11px] text-zinc-500">Lese mit Freunden</p>
          </div>
        </Link>
      </div>

      {/* Recent books */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Zuletzt hinzugefügt
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <BookOpen size={32} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Noch keine Bücher
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Importiere deine Kindle-Highlights
            </p>
            <Link
              href="/import"
              className="mt-3 inline-block rounded-lg bg-amber-500 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
            >
              Jetzt importieren
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {books.slice(0, 5).map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt=""
                    className="h-12 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800">
                    <BookOpen size={14} className="text-zinc-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                    {book.title}
                  </p>
                  {book.author && (
                    <p className="truncate text-xs text-zinc-500">{book.author}</p>
                  )}
                </div>
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  {book._count.highlights}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
