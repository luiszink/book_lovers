import { ParsedClipping } from "@/types";

const SEPARATOR = "==========";

export function parseClippings(content: string): ParsedClipping[] {
  const blocks = content
    .split(SEPARATOR)
    .map((b) => b.trim())
    .filter(Boolean);

  const clippings: ParsedClipping[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    if (lines.length < 3) continue;

    // Line 1: "Book Title (Author Name)" or just "Book Title"
    const titleLine = lines[0];
    const { title, author } = parseBookTitle(titleLine);

    // Line 2: "- Your Highlight on page X | Location Y-Z | Added on ..."
    const metaLine = lines[1];
    const meta = parseMeta(metaLine);

    // Lines 3+: the actual text (skip empty lines between meta and text)
    const textLines = lines.slice(2).filter(Boolean);
    const text = textLines.join("\n").trim();

    if (!text && meta.type !== "BOOKMARK") continue;

    clippings.push({
      bookTitle: title,
      author,
      type: meta.type,
      page: meta.page,
      location: meta.location,
      timestamp: meta.timestamp,
      text: text || "",
    });
  }

  return linkNotesToHighlights(clippings);
}

function parseBookTitle(line: string): { title: string; author: string | null } {
  // Match "Book Title (Author Name)" — author is in last parentheses
  const match = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { title: match[1].trim(), author: match[2].trim() };
  }
  return { title: line.trim(), author: null };
}

function parseMeta(line: string): {
  type: "HIGHLIGHT" | "NOTE" | "BOOKMARK";
  page: string | null;
  location: string | null;
  timestamp: string | null;
} {
  let type: "HIGHLIGHT" | "NOTE" | "BOOKMARK" = "HIGHLIGHT";

  if (/your note/i.test(line)) type = "NOTE";
  else if (/your bookmark/i.test(line)) type = "BOOKMARK";
  else if (/your highlight/i.test(line)) type = "HIGHLIGHT";

  // Also support German Kindle: "Ihre Markierung", "Ihre Notiz"
  if (/ihre notiz/i.test(line)) type = "NOTE";
  else if (/ihr lesezeichen/i.test(line)) type = "BOOKMARK";
  else if (/ihre markierung/i.test(line)) type = "HIGHLIGHT";

  const pageMatch = line.match(/page\s+(\d+(?:-\d+)?)/i) ||
    line.match(/seite\s+(\d+(?:-\d+)?)/i);
  const locationMatch = line.match(/location\s+(\d+(?:-\d+)?)/i) ||
    line.match(/position\s+(\d+(?:-\d+)?)/i);
  const timestampMatch = line.match(/added on\s+(.+)$/i) ||
    line.match(/hinzugefügt am\s+(.+)$/i);

  return {
    type,
    page: pageMatch ? pageMatch[1] : null,
    location: locationMatch ? locationMatch[1] : null,
    timestamp: timestampMatch ? timestampMatch[1].trim() : null,
  };
}

/**
 * Link notes to their preceding highlight if they share the same book + location.
 * In My Clippings.txt, a note usually appears right after its corresponding highlight.
 */
function linkNotesToHighlights(clippings: ParsedClipping[]): ParsedClipping[] {
  // No mutation needed for parsed output — linking is done during DB import
  return clippings;
}
