-- DropForeignKey
ALTER TABLE "MediaAsset" DROP CONSTRAINT IF EXISTS "MediaAsset_folderId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "MediaAsset_folderId_idx";

-- AlterTable
ALTER TABLE "MediaAsset" DROP COLUMN IF EXISTS "folderId";

-- DropTable
DROP TABLE IF EXISTS "MediaFolder";
