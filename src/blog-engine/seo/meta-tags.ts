export function parseMetaTags(value?: string | null) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}
