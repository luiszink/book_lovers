"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, ArrowRight, Copy, Check } from "lucide-react";

interface Group {
  id: string;
  name: string;
  inviteCode: string;
  _count: { members: number; books: number };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadGroups = () => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then(setGroups)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const createGroup = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      setNewName("");
      setShowCreate(false);
      loadGroups();
    }
    setCreating(false);
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode }),
    });
    if (res.ok) {
      setJoinCode("");
      setShowJoin(false);
      loadGroups();
    }
    setJoining(false);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Gruppen
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowJoin(!showJoin);
              setShowCreate(false);
            }}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Beitreten
          </button>
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              setShowJoin(false);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            <Plus size={16} />
            Neue Gruppe
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 font-medium text-zinc-900 dark:text-white">
            Gruppe erstellen
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Gruppenname..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createGroup()}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <button
              onClick={createGroup}
              disabled={creating || !newName.trim()}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {creating ? "..." : "Erstellen"}
            </button>
          </div>
        </div>
      )}

      {/* Join form */}
      {showJoin && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 font-medium text-zinc-900 dark:text-white">
            Gruppe beitreten
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Einladungscode..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinGroup()}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <button
              onClick={joinGroup}
              disabled={joining || !joinCode.trim()}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {joining ? "..." : "Beitreten"}
            </button>
          </div>
        </div>
      )}

      {/* Groups list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Users
            size={48}
            className="mx-auto mb-4 text-zinc-300 dark:text-zinc-600"
          />
          <p className="font-medium text-zinc-600 dark:text-zinc-400">
            Keine Gruppen
          </p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Erstelle eine Gruppe oder tritt einer bei
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {group.name}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                  <span>{group._count.members} Mitglieder</span>
                  <span>{group._count.books} Bücher</span>
                  <button
                    onClick={() => copyCode(group.inviteCode, group.id)}
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-700"
                    title="Einladungscode kopieren"
                  >
                    {copiedId === group.id ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                    {group.inviteCode}
                  </button>
                </div>
              </div>
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Öffnen
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
