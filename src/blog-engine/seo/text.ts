export function cleanWordPressExcerpt(value?: string | null) {
  if (!value) return "";

  return value
    .replace(/\[(?:&hellip;|&#8230;|…|\.\.\.)\]/gi, "")
    .replace(/(?:&hellip;|&#8230;|…)\s*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
