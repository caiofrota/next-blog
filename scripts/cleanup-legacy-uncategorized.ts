import { prisma } from "../src/lib/prisma";
import { deleteCategory } from "../src/blog-engine/services/categories";

async function main() {
  const legacyCategories = await prisma.category.findMany({
    where: {
      OR: [
        { slug: "uncategorized" },
        {
          name: {
            equals: "uncategorized",
            mode: "insensitive"
          }
        }
      ]
    },
    select: { id: true, name: true, slug: true }
  });

  if (legacyCategories.length === 0) {
    console.log("No legacy Uncategorized categories found.");
    return;
  }

  for (const category of legacyCategories) {
    console.log(`Removing legacy category ${category.name} (${category.slug})...`);
    await deleteCategory(category.id);
  }

  console.log(`Removed ${legacyCategories.length} legacy Uncategorized categor${legacyCategories.length === 1 ? "y" : "ies"}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
