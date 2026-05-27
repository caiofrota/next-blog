import { prisma } from "../src/lib/prisma";
import { env } from "../src/lib/env";
import { WordPressMigrator } from "../src/blog-engine/wordpress/migrator";

function getArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!admin) throw new Error("Create an admin user before running the migration.");
  const baseUrl = getArg("--base-url") ?? env.WP_BASE_URL;
  if (!baseUrl) throw new Error("Set WP_BASE_URL or pass --base-url before running the migration.");

  const migrator = new WordPressMigrator({
    baseUrl,
    authorId: admin.id,
    dryRun: process.argv.includes("--dry-run"),
    verbose: process.argv.includes("--verbose"),
    limit: getArg("--limit") ? Number(getArg("--limit")) : undefined,
    postId: getArg("--post-id") ? Number(getArg("--post-id")) : undefined
  });

  await migrator.run();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
