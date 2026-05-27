export function decodeHtml(value: string) {
  return value
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function decodeExcerpt(value: string) {
  return decodeHtml(value)
    .replace(/\[(?:&hellip;|&#8230;|…|\.\.\.)\]/gi, "")
    .replace(/(?:&hellip;|&#8230;|…)\s*$/gi, "")
    .trim();
}

export function extractImageUrls(html: string) {
  return Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1]);
}

export function replaceUrls(html: string, replacements: Map<string, string>) {
  let result = html;
  for (const [oldUrl, newUrl] of replacements.entries()) {
    result = result.split(oldUrl).join(newUrl);
  }
  return result;
}
