/*
  Warnings:

  - You are about to drop the column `active` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ATIVO', 'INATIVO', 'PENDENTE', 'BLOQUEADO');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "active",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ATIVO';
