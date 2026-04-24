/*
  Warnings:

  - You are about to drop the column `cliente_id` on the `Pedido` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_cliente_id_fkey";

-- AlterTable
ALTER TABLE "Pedido" DROP COLUMN "cliente_id";
