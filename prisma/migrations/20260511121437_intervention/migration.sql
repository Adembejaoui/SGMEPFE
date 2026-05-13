/*
  Warnings:

  - You are about to drop the `_ClientDemandes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ClientDemandes" DROP CONSTRAINT "_ClientDemandes_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClientDemandes" DROP CONSTRAINT "_ClientDemandes_B_fkey";

-- DropTable
DROP TABLE "_ClientDemandes";
