export function getPublicStorageUrl(key: string) {
  return `/api/media/${key.replace(/^\//, "")}`;
}
