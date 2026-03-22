"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HighlightChat } from "@/components/chat/highlight-chat";

export default function HighlightChatPage() {
  const params = useParams();
  const highlightId = params.highlightId as string;
  const bookId = params.bookId as string;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <nav className="flex items-center gap-1 text-xs text-zinc-400">
        <Link href="/books" className="hover:text-amber-600 dark:hover:text-amber-400">
          Bücher
        </Link>
        <ChevronRight size={12} />
        <Link
          href={`/books/${bookId}`}
          className="max-w-[200px] truncate hover:text-amber-600 dark:hover:text-amber-400"
        >
          Buch
        </Link>
        <ChevronRight size={12} />
        <span className="text-zinc-600 dark:text-zinc-300">Diskussion</span>
      </nav>

      <HighlightChat highlightId={highlightId} />
    </div>
  );
}
