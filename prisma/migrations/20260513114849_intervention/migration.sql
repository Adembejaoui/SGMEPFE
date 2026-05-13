-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "observation" TEXT;

-- CreateTable
CREATE TABLE "rapports_maintenance" (
    "idRapport" SERIAL NOT NULL,
    "demandeId" INTEGER NOT NULL,
    "diagnostic" TEXT NOT NULL,
    "actionsEffectuees" TEXT NOT NULL,
    "resultat" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rapports_maintenance_pkey" PRIMARY KEY ("idRapport")
);

-- CreateIndex
CREATE UNIQUE INDEX "rapports_maintenance_demandeId_key" ON "rapports_maintenance"("demandeId");

-- AddForeignKey
ALTER TABLE "rapports_maintenance" ADD CONSTRAINT "rapports_maintenance_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_maintenance"("idDemande") ON DELETE CASCADE ON UPDATE CASCADE;
