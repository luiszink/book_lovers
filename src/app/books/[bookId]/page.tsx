"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  MessageSquare,
  StickyNote,
  ChevronRight,
} from "lucide-react";

interface Highlight {
  id: string;
  text: string;
  type: "HIGHLIGHT" | "NOTE" | "BOOKMARK";
  page: string | null;
  location: string | null;
  linkedNotes: { id: string; text: string }[];
  _count: { comments: number };
}

interface BookWithHighlights {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  highlights: Highlight[];
}

export default function BookDetailPage() {
  const params = useParams();
  const [book, setBook] = useState<BookWithHighlights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/books/${params.bookId}`)
      .then((r) => r.json())
      .then(setBook)
      .finally(() => setLoading(false));
  }, [params.bookId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (!book) {
    return <p className="text-zinc-500">Buch nicht gefunden.</p>;
  }

  const highlights = book.highlights.filter((h) => h.type === "HIGHLIGHT");
  const notes = book.highlights.filter((h) => h.type === "NOTE");

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-zinc-400">
        <Link href="/books" className="hover:text-amber-600 dark:hover:text-amber-400">
          Bücher
        </Link>
        <ChevronRight size={12} />
        <span className="truncate text-zinc-600 dark:text-zinc-300">{book.title}</span>
      </nav>

      {/* Book Header Card */}
      <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Cover */}
        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen size={20} className="text-zinc-400" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold leading-snug text-zinc-900 dark:text-white">
            {book.title}
          </h1>
          {book.author && (
            <p className="mt-0.5 text-sm text-zinc-500">{book.author}</p>
          )}
          <div className="mt-2 flex gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              {highlights.length} Highlights
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
              {notes.length} Notizen
            </span>
          </div>
        </div>
      </div>

      {/* Highlights Feed */}
      {highlights.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <BookOpen size={32} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-500">Keine Highlights in diesem Buch.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="group rounded-xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              {/* Content */}
              <div className="px-4 py-3">
                <blockquote className="border-l-3 border-amber-400 pl-3 text-[14px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {highlight.text}
                </blockquote>

                {/* Kindle notes inline */}
                {highlight.linkedNotes.length > 0 &&
                  highlight.linkedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="mt-2 flex items-start gap-1.5 rounded-lg border border-yellow-200/60 bg-yellow-50/70 px-3 py-1.5 dark:border-yellow-900/30 dark:bg-yellow-900/10"
                    >
                      <StickyNote size={11} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-xs leading-relaxed text-yellow-800 dark:text-yellow-200">
                        {note.text}
                      </p>
                    </div>
                  ))}
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-1.5 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  {highlight.page && <span>S. {highlight.page}</span>}
                  {highlight.page && highlight.location && <span>&middot;</span>}
                  {highlight.location && <span>{highlight.location}</span>}
                </div>
                <Link
                  href={`/books/${book.id}/highlights/${highlight.id}`}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-amber-600 dark:hover:bg-zinc-800 dark:hover:text-amber-400"
                >
                  <MessageSquare size={12} />
                  {highlight._count.comments > 0
                    ? `${highlight._count.comments} Kommentare`
                    : "Diskutieren"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
