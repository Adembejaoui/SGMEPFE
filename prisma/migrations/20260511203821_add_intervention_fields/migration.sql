/*
  Warnings:

  - Added the required column `technicianId` to the `Intervention` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatutIntervention" AS ENUM ('OUVERTE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "statut" "StatutIntervention" NOT NULL DEFAULT 'OUVERTE',
ADD COLUMN     "technicianId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
