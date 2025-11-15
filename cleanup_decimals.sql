-- Round all existing quantities to 2 decimal places
UPDATE "InventoryItem" 
SET quantity = ROUND(quantity::numeric, 2);

UPDATE "InventoryItem" 
SET "minimalBalance" = ROUND("minimalBalance"::numeric, 2);

-- Round audit log values
UPDATE "AuditLog" 
SET before = ROUND(before::numeric, 2),
    after = ROUND(after::numeric, 2);
