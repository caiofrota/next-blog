import { env } from "@/lib/env";
import { getPublicStorageUrl } from "./public-url";

const BLOCKED_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "link",
  "meta",
  "base",
  "noscript",
  "svg",
  "math",
  "canvas",
  "video",
  "audio",
  "source",
  "track",
  "applet",
  "frame",
  "frameset",
  "template"
] as const;

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function isSafeUrl(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith("#")) return true;
  if (normalized.startsWith("/")) return true;
  if (normalized.startsWith("uploads/")) return true;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return true;
  if (normalized.startsWith("mailto:")) return true;
  if (normalized.startsWith("tel:")) return true;
  if (normalized.startsWith("sms:")) return true;
  return false;
}

function sanitizeStyle(value: string) {
  const match = value.match(/(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i);
  return match ? `text-align: ${match[1].toLowerCase()}` : "";
}

export function sanitizePostHtml(html: string) {
  let sanitized = html;

  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, "");

  for (const tag of BLOCKED_TAGS) {
    sanitized = sanitized.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), "");
    sanitized = sanitized.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi"), "");
  }

  sanitized = sanitized.replace(/\son[a-z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
  sanitized = sanitized.replace(/\s(srcdoc|formaction|xlink:href|xmlns(:[a-z-]+)?)\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
  sanitized = sanitized.replace(/\starget\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");

  sanitized = sanitized.replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (_match, _quoted, doubleQuoted: string | undefined, singleQuoted: string | undefined) => {
    const style = doubleQuoted ?? singleQuoted ?? "";
    const nextStyle = sanitizeStyle(style);
    return nextStyle ? ` style="${escapeAttribute(nextStyle)}"` : "";
  });

  sanitized = sanitized.replace(/\s(href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_match, attr: string, quoted: string, doubleQuoted: string | undefined, singleQuoted: string | undefined, unquoted: string | undefined) => {
    const value = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
    if (!isSafeUrl(value)) {
      return "";
    }
    return ` ${attr}="${escapeAttribute(value)}"`;
  });

  return sanitized;
}

export function normalizeMediaUrlsInHtml(html: string) {
  let normalized = html.replace(/(src=["'])\/api\/media\/([^"']+)(["'])/g, (_match, before: string, key: string, after: string) => {
    return `${before}${key}${after}`;
  });

  if (env.R2_PUBLIC_BASE_URL) {
    const base = env.R2_PUBLIC_BASE_URL.replace(/\/$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(new RegExp(`(src=["'])${base}/([^"']+)(["'])`, "g"), (_match, before: string, key: string, after: string) => {
      return `${before}${key}${after}`;
    });
  }

  return normalized;
}

export function resolveMediaUrlsInHtml(html: string) {
  let resolved = html.replace(/(src=["'])(uploads\/[^"']+)(["'])/g, (_match, before: string, key: string, after: string) => {
    return `${before}${getPublicStorageUrl(key)}${after}`;
  });

  if (env.R2_PUBLIC_BASE_URL) {
    const base = env.R2_PUBLIC_BASE_URL.replace(/\/$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    resolved = resolved.replace(new RegExp(`(src=["'])${base}/([^"']+)(["'])`, "g"), (_match, before: string, key: string, after: string) => {
      return `${before}${getPublicStorageUrl(key)}${after}`;
    });
  }

  return resolved;
}
