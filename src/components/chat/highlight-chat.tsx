"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import {
  Send,
  Loader2,
  StickyNote,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageSquare,
  CornerDownRight,
  ArrowBigUp,
  ArrowBigDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────

interface FlatComment {
  id: string;
  text: string;
  parentId: string | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
  score: number;
  userVote: number;
}

interface CommentNode extends FlatComment {
  replies: CommentNode[];
}

interface NeighborHighlight {
  id: string;
  text: string;
  page: string | null;
  location: string | null;
}

interface HighlightData {
  id: string;
  text: string;
  type: string;
  page: string | null;
  location: string | null;
  wordCount: number;
  bookId: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
  linkedNotes: { id: string; text: string }[];
  neighborHighlights: {
    before: NeighborHighlight[];
    after: NeighborHighlight[];
  };
}

// ── Helpers ────────────────────────────────────────────────────

function buildTree(flat: FlatComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of flat) map.set(c.id, { ...c, replies: [] });
  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
}

// ── Avatar ─────────────────────────────────────────────────────

function Avatar({
  user,
  size = 28,
}: {
  user: { name: string | null; image: string | null };
  size?: number;
}) {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {user.name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ── Vote Buttons ───────────────────────────────────────────────

function VoteButtons({
  score,
  userVote,
  onVote,
}: {
  score: number;
  userVote: number;
  onVote: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        className={`rounded p-0.5 transition-colors ${
          userVote === 1
            ? "text-amber-500"
            : "text-zinc-400 hover:text-amber-500"
        }`}
      >
        <ArrowBigUp size={16} fill={userVote === 1 ? "currentColor" : "none"} />
      </button>
      <span
        className={`min-w-[1.25rem] text-center text-xs font-semibold ${
          score > 0
            ? "text-amber-600 dark:text-amber-400"
            : score < 0
              ? "text-blue-500"
              : "text-zinc-400"
        }`}
      >
        {score}
      </span>
      <button
        onClick={() => onVote(userVote === -1 ? 0 : -1)}
        className={`rounded p-0.5 transition-colors ${
          userVote === -1
            ? "text-blue-500"
            : "text-zinc-400 hover:text-blue-500"
        }`}
      >
        <ArrowBigDown size={16} fill={userVote === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

// ── Reply Input ────────────────────────────────────────────────

function ReplyInput({
  onSubmit,
  onCancel,
  sending,
}: {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  sending: boolean;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="mt-2 flex gap-2">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && text.trim()) {
            onSubmit(text.trim());
          }
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Antwort schreiben..."
        rows={2}
        className="flex-1 resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:bg-zinc-900"
      />
      <div className="flex flex-col gap-1">
        <button
          onClick={() => text.trim() && onSubmit(text.trim())}
          disabled={!text.trim() || sending}
          className="rounded-lg bg-amber-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-600"
        >
          Esc
        </button>
      </div>
    </div>
  );
}

// ── Comment Thread ─────────────────────────────────────────────

function CommentThread({
  node,
  depth,
  sessionUserId,
  replyingTo,
  setReplyingTo,
  onReply,
  onVote,
  sending,
}: {
  node: CommentNode;
  depth: number;
  sessionUserId: string | undefined;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  onReply: (parentId: string, text: string) => void;
  onVote: (commentId: string, value: number) => void;
  sending: boolean;
}) {
  const isOwn = node.user.id === sessionUserId;
  const maxDepth = 5;

  return (
    <div className={depth > 0 ? "ml-4 border-l-2 border-zinc-100 pl-3 dark:border-zinc-800" : ""}>
      <div className="group py-2">
        {/* Header: avatar · name · time */}
        <div className="flex items-center gap-1.5">
          <Avatar user={node.user} size={20} />
          <span
            className={`text-xs font-semibold ${
              isOwn ? "text-amber-600 dark:text-amber-400" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {node.user.name ?? "Unbekannt"}
          </span>
          {isOwn && (
            <span className="rounded bg-amber-500/10 px-1 py-px text-[10px] font-medium text-amber-600 dark:text-amber-400">
              du
            </span>
          )}
          <span className="text-[11px] text-zinc-400">&middot;</span>
          <span className="text-[11px] text-zinc-400">{timeAgo(node.createdAt)}</span>
        </div>

        {/* Body */}
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          {node.text}
        </p>

        {/* Action bar */}
        <div className="mt-1 flex items-center gap-3">
          <VoteButtons
            score={node.score}
            userVote={node.userVote}
            onVote={(v) => onVote(node.id, v)}
          />
          {depth < maxDepth && (
            <button
              onClick={() => setReplyingTo(replyingTo === node.id ? null : node.id)}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400"
            >
              <CornerDownRight size={11} />
              Antworten
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyingTo === node.id && (
          <ReplyInput
            onSubmit={(text) => onReply(node.id, text)}
            onCancel={() => setReplyingTo(null)}
            sending={sending}
          />
        )}
      </div>

      {/* Nested replies */}
      {node.replies.map((child) => (
        <CommentThread
          key={child.id}
          node={child}
          depth={depth + 1}
          sessionUserId={sessionUserId}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          onReply={onReply}
          onVote={onVote}
          sending={sending}
        />
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function HighlightChat({ highlightId }: { highlightId: string }) {
  const { data: session } = useSession();
  const [flatComments, setFlatComments] = useState<FlatComment[]>([]);
  const [highlight, setHighlight] = useState<HighlightData | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load data
  useEffect(() => {
    Promise.all([
      fetch(`/api/comments?highlightId=${highlightId}`).then((r) => r.json()),
      fetch(`/api/highlights/${highlightId}`).then((r) => r.json()),
    ])
      .then(([commentsData, highlightData]) => {
        if (Array.isArray(commentsData)) setFlatComments(commentsData);
        if (highlightData && !highlightData.error) setHighlight(highlightData);
      })
      .finally(() => setLoading(false));
  }, [highlightId]);

  // Socket
  useEffect(() => {
    const socket = io(window.location.origin, { path: "/api/socketio" });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("join-highlight", highlightId));
    socket.on("new-comment", (comment: FlatComment) =>
      setFlatComments((prev) => [...prev, comment])
    );
    socket.on("user-typing", (userName: string) => {
      setTyping(userName);
      setTimeout(() => setTyping(null), 3000);
    });
    return () => {
      socket.disconnect();
    };
  }, [highlightId]);

  useEffect(scrollToBottom, [flatComments, scrollToBottom]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ highlightId, text: newMessage }),
      });
      if (res.ok) {
        const comment = await res.json();
        socketRef.current?.emit("new-comment", { highlightId, comment });
        setFlatComments((prev) => [...prev, comment]);
        setNewMessage("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (parentId: string, text: string) => {
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ highlightId, text, parentId }),
      });
      if (res.ok) {
        const comment = await res.json();
        socketRef.current?.emit("new-comment", { highlightId, comment });
        setFlatComments((prev) => [...prev, comment]);
        setReplyingTo(null);
      }
    } finally {
      setSending(false);
    }
  };

  const handleVote = async (commentId: string, value: number) => {
    const res = await fetch(`/api/comments/${commentId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      const { score, userVote } = await res.json();
      setFlatComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, score, userVote } : c))
      );
    }
  };

  const handleTyping = () => {
    socketRef.current?.emit("typing", {
      highlightId,
      userName: session?.user?.name ?? "Jemand",
    });
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const tree = buildTree(flatComments);
  const commentCount = flatComments.length;

  const hasNeighbors =
    highlight &&
    (highlight.neighborHighlights.before.length > 0 ||
      highlight.neighborHighlights.after.length > 0);

  return (
    <div className="space-y-3">
      {/* ── Highlight Post Card ───────────────────────────────── */}
      {highlight && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {/* Sub-header: book context */}
          <div className="flex items-center gap-2 bg-zinc-50 px-4 py-2 dark:bg-zinc-800/50">
            {highlight.book.coverUrl ? (
              <img
                src={highlight.book.coverUrl}
                alt=""
                className="h-5 w-4 rounded-sm object-cover"
              />
            ) : (
              <BookOpen size={12} className="text-zinc-400" />
            )}
            <Link
              href={`/books/${highlight.book.id}`}
              className="text-xs font-medium text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
            >
              {highlight.book.title}
            </Link>
            {highlight.book.author && (
              <span className="text-xs text-zinc-400">
                von {highlight.book.author}
              </span>
            )}
          </div>

          <div className="px-4 py-3">
            {/* Label */}
            <span className="mb-1.5 inline-block text-[10px] font-bold uppercase tracking-widest text-amber-500">
              Markierte Passage
            </span>

            {/* Highlight text */}
            <blockquote className="border-l-3 border-amber-400 pl-3 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
              {highlight.text}
            </blockquote>

            {/* Meta badges */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
              {highlight.page && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                  Seite {highlight.page}
                </span>
              )}
              {highlight.location && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                  {highlight.location}
                </span>
              )}
              {highlight.wordCount > 0 && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                  {highlight.wordCount} Wörter
                </span>
              )}
              <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                <MessageSquare size={10} />
                {commentCount}
              </span>
            </div>

            {/* Kindle notes */}
            {highlight.linkedNotes.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {highlight.linkedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 rounded-lg border border-yellow-200/60 bg-yellow-50 px-3 py-2 dark:border-yellow-900/30 dark:bg-yellow-900/10"
                  >
                    <StickyNote
                      size={12}
                      className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                        Kindle-Notiz
                      </span>
                      <p className="text-xs leading-relaxed text-yellow-800 dark:text-yellow-200">
                        {note.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Context accordion */}
          {hasNeighbors && (
            <div className="border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setContextOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-2 text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <span>Kontext anzeigen</span>
                {contextOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {contextOpen && (
                <div className="space-y-1.5 px-4 pb-3">
                  {highlight.neighborHighlights.before.map((n) => (
                    <Link
                      key={n.id}
                      href={`/books/${highlight.book.id}/highlights/${n.id}`}
                      className="block rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <span className="mr-1.5 font-semibold uppercase tracking-wide text-zinc-400">
                        ↑{n.page ? ` S.${n.page}` : ""}
                      </span>
                      <span className="line-clamp-1">{n.text}</span>
                    </Link>
                  ))}
                  {highlight.neighborHighlights.after.map((n) => (
                    <Link
                      key={n.id}
                      href={`/books/${highlight.book.id}/highlights/${n.id}`}
                      className="block rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <span className="mr-1.5 font-semibold uppercase tracking-wide text-zinc-400">
                        ↓{n.page ? ` S.${n.page}` : ""}
                      </span>
                      <span className="line-clamp-1">{n.text}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Comment Input ─────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-2.5">
          {session?.user && (
            <Avatar
              user={{ name: session.user.name ?? null, image: session.user.image ?? null }}
              size={28}
            />
          )}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
              }}
              placeholder="Was denkst du über diese Passage?"
              rows={1}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:bg-zinc-900"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                Ctrl+Enter zum Senden
              </span>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                Senden
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Comments Section ──────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-1.5 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
          <MessageSquare size={13} className="text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {commentCount} Kommentar{commentCount !== 1 ? "e" : ""}
          </span>
        </div>

        <div className="px-4 pb-2">
          {tree.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-400">
              Noch keine Kommentare — starte die Diskussion!
            </p>
          ) : (
            tree.map((node) => (
              <CommentThread
                key={node.id}
                node={node}
                depth={0}
                sessionUserId={session?.user?.id}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                onReply={handleReply}
                onVote={handleVote}
                sending={sending}
              />
            ))
          )}
          {typing && (
            <p className="py-1.5 text-[11px] text-zinc-400 italic">
              {typing} tippt...
            </p>
          )}
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
