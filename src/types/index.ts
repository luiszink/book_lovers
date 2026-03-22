export interface ParsedClipping {
  bookTitle: string;
  author: string | null;
  type: "HIGHLIGHT" | "NOTE" | "BOOKMARK";
  page: string | null;
  location: string | null;
  timestamp: string | null;
  text: string;
}

export interface ImportResult {
  booksCreated: number;
  highlightsCreated: number;
  notesCreated: number;
  duplicatesSkipped: number;
}
