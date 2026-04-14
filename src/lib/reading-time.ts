// ── Reading Time Calculator ────────────────────────────────────────────────────
// Extracts plain text from TipTap JSON content recursively and estimates
// reading time based on locale-specific average reading speeds.
//
// Arabic average:  200 words/min
// English average: 250 words/min

type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
};

/** Recursively extract all plain text from a TipTap JSON document */
function extractText(node: TipTapNode): string {
  const parts: string[] = [];

  if (node.text) {
    parts.push(node.text);
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      parts.push(extractText(child));
    }
  }

  return parts.join(" ");
}

/** Count words in a plain-text string (handles both Arabic and Latin scripts) */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/**
 * Calculate estimated reading time in minutes from TipTap JSON content.
 * Returns at least 1 minute.
 */
export function calculateReadingTime(
  content: object | null,
  locale: "ar" | "en" = "ar"
): number {
  if (!content) return 1;

  const wordsPerMinute = locale === "ar" ? 200 : 250;
  const text = extractText(content as TipTapNode);
  const words = countWords(text);

  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Format reading time as a human-readable label.
 *
 * @example
 *   getReadingTimeLabel(3, "ar") // "٣ دقائق للقراءة"
 *   getReadingTimeLabel(1, "ar") // "دقيقة للقراءة"
 *   getReadingTimeLabel(3, "en") // "3 min read"
 *   getReadingTimeLabel(1, "en") // "1 min read"
 */
export function getReadingTimeLabel(
  minutes: number,
  locale: "ar" | "en"
): string {
  if (locale === "en") {
    return `${minutes} min read`;
  }

  // Arabic: convert digits to Eastern Arabic numerals and apply correct plural form
  const arabicDigits = minutes
    .toString()
    .replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);

  if (minutes === 1) return "دقيقة للقراءة";
  if (minutes === 2) return "دقيقتان للقراءة";
  if (minutes >= 3 && minutes <= 10) return `${arabicDigits} دقائق للقراءة`;
  return `${arabicDigits} دقيقة للقراءة`;
}
