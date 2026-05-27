export function getPrimaryCategory<T extends { slug: string; name?: string }>(categories: T[]) {
  return categories[0] ?? null;
}
