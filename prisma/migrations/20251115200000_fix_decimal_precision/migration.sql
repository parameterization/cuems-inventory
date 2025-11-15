-- AlterTable
ALTER TABLE "AuditLog" 
  ALTER COLUMN "before" TYPE DECIMAL(10,2),
  ALTER COLUMN "after" TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "InventoryItem" 
  ALTER COLUMN "quantity" TYPE DECIMAL(10,2),
  ALTER COLUMN "minimalBalance" TYPE DECIMAL(10,2);

