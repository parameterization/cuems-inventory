-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_itemId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "itemName" TEXT,
ALTER COLUMN "itemId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
