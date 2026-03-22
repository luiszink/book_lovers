"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Check, AlertCircle, Loader2 } from "lucide-react";
import { ImportResult } from "@/types";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import fehlgeschlagen");
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Highlights importieren
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Lade deine <code className="text-amber-600">My Clippings.txt</code>{" "}
          Datei vom Kindle hoch
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 sm:p-12 transition-colors ${
          dragging
            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10"
            : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        }`}
      >
        <Upload
          size={40}
          className={`mb-4 ${
            dragging ? "text-amber-500" : "text-zinc-300 dark:text-zinc-600"
          }`}
        />
        <p className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">
          Datei hierher ziehen
        </p>
        <p className="mb-4 text-sm text-zinc-400">oder</p>
        <label className="cursor-pointer rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
          Datei auswählen
          <input
            type="file"
            accept=".txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      </div>

      {/* Selected file */}
      {file && (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-amber-500" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">
                {file.name}
              </p>
              <p className="text-xs text-zinc-400">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importiere...
              </>
            ) : (
              "Importieren"
            )}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-900/20">
          <div className="mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
            <Check size={20} />
            <span className="font-semibold">Import erfolgreich!</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Stat label="Bücher" value={result.booksCreated} />
            <Stat label="Highlights" value={result.highlightsCreated} />
            <Stat label="Notizen" value={result.notesCreated} />
            <Stat label="Duplikate übersprungen" value={result.duplicatesSkipped} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 font-semibold text-zinc-900 dark:text-white">
          So findest du die Datei
        </h2>
        <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>1. Verbinde deinen Kindle per USB mit dem Computer</li>
          <li>
            2. Öffne das Kindle-Laufwerk und navigiere zu{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              documents/My Clippings.txt
            </code>
          </li>
          <li>3. Lade die Datei hier hoch</li>
        </ol>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-3 dark:bg-zinc-900">
      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
        {value}
      </p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
