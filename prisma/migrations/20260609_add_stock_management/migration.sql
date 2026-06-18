-- Create or replace enums safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaterielType') THEN
        CREATE TYPE "MaterielType" AS ENUM ('PIECE_DETACHEE', 'CONSOMMABLE', 'OUTIL');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatutCommande') THEN
        CREATE TYPE "StatutCommande" AS ENUM ('EN_ATTENTE', 'RECUE', 'ANNULEE');
    END IF;
END $$;

-- Handle existing Intervention table (created with uppercase in earlier migration)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Intervention' AND schemaname = 'public') THEN
        ALTER TABLE "Intervention" RENAME TO "interventions";
    END IF;
END $$;

-- Add missing columns to interventions table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interventions' AND column_name = 'technicianId') THEN
        ALTER TABLE "interventions" ADD COLUMN "technicianId" TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interventions' AND column_name = 'description') THEN
        ALTER TABLE "interventions" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interventions' AND column_name = 'observation') THEN
        ALTER TABLE "interventions" ADD COLUMN "observation" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interventions' AND column_name = 'statut') THEN
        ALTER TABLE "interventions" ADD COLUMN "statut" TEXT NOT NULL DEFAULT 'OUVERTE';
    END IF;
END $$;

-- Drop old primary key if it exists (single column on idIntervention)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Intervention_pkey' AND conrelid = 'interventions'::regclass) THEN
        ALTER TABLE "interventions" DROP CONSTRAINT "Intervention_pkey";
    END IF;
END $$;

-- Re-add primary key
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_pkey" PRIMARY KEY ("idIntervention");

-- Add foreign keys if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interventions_demandeId_fkey') THEN
        ALTER TABLE "interventions" ADD CONSTRAINT "interventions_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_maintenance"("idDemande") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interventions_technicianId_fkey') THEN
        ALTER TABLE "interventions" ADD CONSTRAINT "interventions_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable
CREATE TABLE "materiels" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "type" "MaterielType" NOT NULL,
    "quantiteStock" INTEGER NOT NULL DEFAULT 0,
    "seuilAlerte" INTEGER NOT NULL DEFAULT 0,
    "unite" TEXT NOT NULL DEFAULT 'unité',
    "emplacement" TEXT,
    "prixUnitaire" DOUBLE PRECISION,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisations_materiel" (
    "id" SERIAL NOT NULL,
    "materielId" INTEGER NOT NULL,
    "interventionId" INTEGER NOT NULL,
    "quantiteUtilisee" INTEGER NOT NULL,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisations_materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes_stock" (
    "id" SERIAL NOT NULL,
    "materielId" INTEGER NOT NULL,
    "quantiteCommandee" INTEGER NOT NULL,
    "fournisseur" TEXT,
    "statut" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateCommande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReception" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materiels_reference_key" ON "materiels"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "utilisations_materiel_materielId_interventionId_key" ON "utilisations_materiel"("materielId", "interventionId");

-- AddForeignKey
ALTER TABLE "materiels" ADD CONSTRAINT "materiels_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisations_materiel" ADD CONSTRAINT "utilisations_materiel_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisations_materiel" ADD CONSTRAINT "utilisations_materiel_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("idIntervention") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_stock" ADD CONSTRAINT "commandes_stock_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
