import { prisma } from "../src/lib/prisma";
import { upsertCategory } from "../src/blog-engine/services/categories";

async function main() {
  const categories = ["Notícias", "Guias", "Opinião", "Entrevistas", "Tutoriais", "Institucional"];
  for (const category of categories) {
    await upsertCategory(category);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
