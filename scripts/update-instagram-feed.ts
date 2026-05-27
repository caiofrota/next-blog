import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

type InstagramPost = {
  shortcode: string;
  thumbnailUrl: string;
  caption?: string;
};

type GeneratedInstagramPost = {
  imageUrl: string;
  href: string;
  alt: string;
};

const DEFAULT_LIMIT = 9;
const OUTPUT_DIR = path.join(process.cwd(), "public", "instagram");
const OUTPUT_JSON = path.join(process.cwd(), "src", "site", "config", "instagram-feed.json");
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";
const execFileAsync = promisify(execFile);

async function main() {
  const { username, limit } = parseArgs(process.argv.slice(2));

  await mkdir(OUTPUT_DIR, { recursive: true });

  const posts = await fetchInstagramPosts(username, limit);
  if (posts.length === 0) {
    throw new Error(`No public posts found for @${username}.`);
  }

  await clearOutputDir();

  const generated: GeneratedInstagramPost[] = [];

  for (const post of posts) {
    const image = await downloadThumbnail(username, post);
    generated.push({
      imageUrl: image.publicPath,
      href: `https://www.instagram.com/p/${post.shortcode}/`,
      alt: post.caption ? cleanCaption(post.caption, username) : `Post do Instagram @${username}`
    });
  }

  await writeFile(OUTPUT_JSON, `${JSON.stringify(generated, null, 2)}\n`, "utf8");
  console.log(`Updated ${generated.length} Instagram posts for @${username}.`);
  console.log(`Images saved to ${path.relative(process.cwd(), OUTPUT_DIR)}/`);
  console.log(`Config saved to ${path.relative(process.cwd(), OUTPUT_JSON)}`);
}

function parseArgs(args: string[]) {
  const username = [...args].reverse().find((arg) => !arg.startsWith("-"))?.replace(/^@/, "");
  const limitFlagIndex = args.findIndex((arg) => arg === "--limit" || arg === "-l");
  const limitValue = limitFlagIndex >= 0 ? Number(args[limitFlagIndex + 1]) : Number(process.env.INSTAGRAM_FEED_LIMIT ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(Math.floor(limitValue), 24) : DEFAULT_LIMIT;

  if (!username) {
    throw new Error("Usage: pnpm update:instagram-feed -- <username> [--limit 9]");
  }

  return { username, limit };
}

async function fetchInstagramPosts(username: string, limit: number): Promise<InstagramPost[]> {
  const session = await fetchPublicSession(username);
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const payload = JSON.parse(
    await curl(url, [
      "-b",
      session.cookieFile,
      "-H",
      "accept: application/json",
      "-H",
      `referer: https://www.instagram.com/${username}/`,
      "-H",
      `user-agent: ${USER_AGENT}`,
      "-H",
      `x-csrftoken: ${session.csrfToken}`,
      "-H",
      "x-ig-app-id: 936619743392459"
    ])
  ) as {
    data?: {
      user?: {
        edge_owner_to_timeline_media?: {
          edges?: Array<{
            node?: {
              shortcode?: string;
              thumbnail_src?: string;
              display_url?: string;
              edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> };
            };
          }>;
        };
      };
    };
  };

  const edges = payload.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
  const posts: InstagramPost[] = [];

  for (const edge of edges) {
    const node = edge.node;
    const shortcode = node?.shortcode;
    const thumbnailUrl = node?.thumbnail_src ?? node?.display_url;
    if (!shortcode || !thumbnailUrl) continue;

    posts.push({
      shortcode,
      thumbnailUrl,
      caption: node?.edge_media_to_caption?.edges?.[0]?.node?.text
    });
  }

  return posts.slice(0, limit);
}

async function fetchPublicSession(username: string) {
  const cookieFile = path.join("/tmp", `instagram-feed-${username}-${Date.now()}.cookies`);
  await curl(`https://www.instagram.com/${encodeURIComponent(username)}/`, ["-c", cookieFile, "-H", `user-agent: ${USER_AGENT}`]);

  const cookies = await import("node:fs/promises").then((fs) => fs.readFile(cookieFile, "utf8"));
  const csrfToken = cookies.match(/csrftoken\s+([^\s]+)/)?.[1];

  if (!csrfToken) {
    throw new Error(`Could not read Instagram public session cookie for @${username}.`);
  }

  return { csrfToken, cookieFile };
}

async function downloadThumbnail(username: string, post: InstagramPost) {
  const response = await fetch(post.thumbnailUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Could not download thumbnail for ${post.shortcode}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const extension = contentType.includes("png") ? "png" : "jpg";
  const fileName = `${username}-${post.shortcode}.${extension}`;
  const outputPath = path.join(OUTPUT_DIR, fileName);
  const buffer = Buffer.from(await response.arrayBuffer());

  await writeFile(outputPath, buffer);

  return { publicPath: `/instagram/${fileName}` };
}

async function clearOutputDir() {
  const entries = await readdir(OUTPUT_DIR, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) => rm(path.join(OUTPUT_DIR, entry.name)))
  );
}

async function curl(url: string, args: string[] = []) {
  const { stdout } = await execFileAsync("curl", ["-fsSL", ...args, url], { maxBuffer: 1024 * 1024 * 20 });
  return stdout;
}

function cleanCaption(caption: string, username: string) {
  const normalized = caption.replace(/\s+/g, " ").trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized || `Post do Instagram @${username}`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
