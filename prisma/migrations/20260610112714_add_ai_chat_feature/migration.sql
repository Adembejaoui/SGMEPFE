-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('TECHNICIEN', 'ASSISTANT');

-- DropForeignKey
ALTER TABLE "commandes_stock" DROP CONSTRAINT "commandes_stock_materielId_fkey";

-- DropForeignKey
ALTER TABLE "utilisations_materiel" DROP CONSTRAINT "utilisations_materiel_interventionId_fkey";

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "interventionId" INTEGER NOT NULL,
    "senderId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chat_sessions" (
    "id" TEXT NOT NULL,
    "interventionId" INTEGER NOT NULL,
    "technicianId" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "contenu" TEXT NOT NULL,
    "diagnostic" TEXT,
    "suggestedActions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_interventionId_idx" ON "messages"("interventionId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "ai_chat_sessions_interventionId_idx" ON "ai_chat_sessions"("interventionId");

-- CreateIndex
CREATE INDEX "ai_chat_sessions_technicianId_idx" ON "ai_chat_sessions"("technicianId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_chat_sessions_interventionId_technicianId_key" ON "ai_chat_sessions"("interventionId", "technicianId");

-- CreateIndex
CREATE INDEX "ai_chat_messages_sessionId_idx" ON "ai_chat_messages"("sessionId");

-- RenameForeignKey
ALTER TABLE "interventions" RENAME CONSTRAINT "Intervention_demandeId_fkey" TO "interventions_demandeId_fkey";

-- RenameForeignKey
ALTER TABLE "interventions" RENAME CONSTRAINT "Intervention_technicianId_fkey" TO "interventions_technicianId_fkey";

-- AddForeignKey
ALTER TABLE "utilisations_materiel" ADD CONSTRAINT "utilisations_materiel_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("idIntervention") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_stock" ADD CONSTRAINT "commandes_stock_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("idIntervention") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("idIntervention") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ai_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
