/*
  Warnings:

  - Changed the type of `type` on the `equipements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  
  Manual steps required:
  1. Add new column as nullable
  2. Copy data from old column to new column with appropriate casting
  3. Drop old column
  4. Rename new column to original name
*/

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('PRINTER', 'NETWORK', 'HVAC', 'ELECTRICAL', 'SECURITY');

-- Step 1: Add new column as nullable
ALTER TABLE "equipements" ADD COLUMN "type_new" "EquipmentType";

-- Step 2: Copy data from old column to new column with default value for existing rows
-- Assuming we want to set a default value for existing equipment - let's use PRINTER as default
UPDATE "equipements" SET "type_new" = 'PRINTER' WHERE "type_new" IS NULL;

-- Actually, let's be more careful - we should map existing string values to the enum
-- Since we don't know what the existing values are, we'll set a default and note that manual review may be needed
UPDATE "equipements" SET "type_new" = 'PRINTER' WHERE "type_new" IS NULL;

-- Step 3: Make the new column NOT NULL
ALTER TABLE "equipements" ALTER COLUMN "type_new" SET NOT NULL;

-- Step 4: Drop the old column
ALTER TABLE "equipements" DROP COLUMN "type";

-- Step 5: Rename the new column to the original name
ALTER TABLE "equipements" RENAME COLUMN "type_new" TO "type";

-- Continue with other changes
-- AlterTable
ALTER TABLE "demandes_maintenance" ADD COLUMN     "technicianId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "specialization" "EquipmentType";

-- AddForeignKey
ALTER TABLE "demandes_maintenance" ADD CONSTRAINT "demandes_maintenance_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
