/*
  Warnings:

  - The primary key for the `demandes_maintenance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dateEcheance` on the `demandes_maintenance` table. All the data in the column will be lost.
  - You are about to drop the column `dateResolution` on the `demandes_maintenance` table. All the data in the column will be lost.
  - You are about to drop the column `employeId` on the `demandes_maintenance` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `demandes_maintenance` table. All the data in the column will be lost.
  - You are about to drop the column `titre` on the `demandes_maintenance` table. All the data in the column will be lost.
  - The `statut` column on the `demandes_maintenance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `clientId` to the `demandes_maintenance` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `demandes_maintenance` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `priorite` on the `demandes_maintenance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PrioriteDemande" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'EN_COURS', 'TRAITEE', 'REJETEE', 'ANNULEE');

-- DropForeignKey
ALTER TABLE "demandes_maintenance" DROP CONSTRAINT "demandes_maintenance_employeId_fkey";

-- AlterTable
ALTER TABLE "demandes_maintenance" DROP CONSTRAINT "demandes_maintenance_pkey",
DROP COLUMN "dateEcheance",
DROP COLUMN "dateResolution",
DROP COLUMN "employeId",
DROP COLUMN "id",
DROP COLUMN "titre",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "idDemande" SERIAL NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
DROP COLUMN "priorite",
ADD COLUMN     "priorite" "PrioriteDemande" NOT NULL,
DROP COLUMN "statut",
ADD COLUMN     "statut" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
ADD CONSTRAINT "demandes_maintenance_pkey" PRIMARY KEY ("idDemande");

-- CreateTable
CREATE TABLE "Intervention" (
    "idIntervention" SERIAL NOT NULL,
    "demandeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("idIntervention")
);

-- CreateTable
CREATE TABLE "_ClientDemandes" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClientDemandes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ClientDemandes_B_index" ON "_ClientDemandes"("B");

-- AddForeignKey
ALTER TABLE "demandes_maintenance" ADD CONSTRAINT "demandes_maintenance_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_maintenance"("idDemande") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientDemandes" ADD CONSTRAINT "_ClientDemandes_A_fkey" FOREIGN KEY ("A") REFERENCES "demandes_maintenance"("idDemande") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientDemandes" ADD CONSTRAINT "_ClientDemandes_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
