"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, BookOpen, Plus, X, Loader2 } from "lucide-react";

interface GroupDetail {
  id: string;
  name: string;
  inviteCode: string;
  members: {
    role: string;
    user: { id: string; name: string | null; image: string | null };
  }[];
  books: {
    book: {
      id: string;
      title: string;
      author: string | null;
      coverUrl: string | null;
      _count: { highlights: number };
    };
  }[];
}

interface UserBook {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
}

export default function GroupDetailPage() {
  const params = useParams();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const reload = () => {
    fetch(`/api/groups/${params.groupId}`)
      .then((r) => r.json())
      .then(setGroup);
  };

  useEffect(() => {
    fetch(`/api/groups/${params.groupId}`)
      .then((r) => r.json())
      .then(setGroup)
      .finally(() => setLoading(false));
  }, [params.groupId]);

  const openAddBook = () => {
    setShowAddBook(true);
    if (userBooks.length === 0) {
      setLoadingBooks(true);
      fetch("/api/books")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setUserBooks(data);
        })
        .finally(() => setLoadingBooks(false));
    }
  };

  const addBook = async (bookId: string) => {
    setAdding(bookId);
    try {
      await fetch(`/api/groups/${params.groupId}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      reload();
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (!group) {
    return <p className="text-zinc-500">Gruppe nicht gefunden.</p>;
  }

  const groupBookIds = new Set(group.books.map((gb) => gb.book.id));
  const availableBooks = userBooks.filter((b) => !groupBookIds.has(b.id));

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div>
        <nav className="mb-1 flex items-center gap-1 text-xs text-zinc-400">
          <Link href="/groups" className="hover:text-amber-600 dark:hover:text-amber-400">Gruppen</Link>
          <span>›</span>
          <span className="text-zinc-600 dark:text-zinc-300">{group.name}</span>
        </nav>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          {group.name}
        </h1>
        <p className="text-sm text-zinc-400">
          Einladungscode:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
            {group.inviteCode}
          </code>
        </p>
      </div>

      {/* Members */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
          <Users size={18} />
          Mitglieder ({group.members.length})
        </h2>
        <div className="flex flex-wrap gap-3">
          {group.members.map((m) => (
            <div
              key={m.user.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {m.user.image ? (
                <img src={m.user.image} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                  {m.user.name?.[0] ?? "?"}
                </div>
              )}
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {m.user.name ?? "Unbekannt"}
              </span>
              {m.role === "OWNER" && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Owner
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Books */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
            <BookOpen size={18} />
            Bücher ({group.books.length})
          </h2>
          <button
            onClick={openAddBook}
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
          >
            <Plus size={14} />
            Buch hinzufügen
          </button>
        </div>

        {/* Add book modal */}
        {showAddBook && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Wähle ein Buch aus deiner Bibliothek:
              </p>
              <button
                onClick={() => setShowAddBook(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X size={16} />
              </button>
            </div>
            {loadingBooks ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-400" />
            ) : availableBooks.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {userBooks.length === 0
                  ? "Du hast noch keine Bücher importiert."
                  : "Alle deine Bücher sind bereits in dieser Gruppe."}
              </p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {availableBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => addBook(book.id)}
                    disabled={adding === book.id}
                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2.5 text-left transition-colors hover:border-amber-300 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt=""
                        className="h-10 w-7 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-7 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-700">
                        <BookOpen size={12} className="text-zinc-400" />
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
                    {adding === book.id ? (
                      <Loader2 size={14} className="animate-spin text-amber-500" />
                    ) : (
                      <Plus size={14} className="text-zinc-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {group.books.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Noch keine Bücher in dieser Gruppe.
          </p>
        ) : (
          <div className="space-y-2">
            {group.books.map((gb) => (
              <Link
                key={gb.book.id}
                href={`/books/${gb.book.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {gb.book.coverUrl ? (
                  <img
                    src={gb.book.coverUrl}
                    alt=""
                    className="h-12 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-8 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800">
                    <BookOpen size={14} className="text-zinc-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {gb.book.title}
                  </p>
                  {gb.book.author && (
                    <p className="text-sm text-zinc-500">{gb.book.author}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-400">
                  {gb.book._count.highlights} Highlights
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
