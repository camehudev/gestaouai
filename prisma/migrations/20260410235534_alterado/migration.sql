/*
  Warnings:

  - The `createdAt` column on the `PedidoHistorico` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "PedidoHistorico_pedido_id_key";

-- AlterTable
ALTER TABLE "PedidoHistorico" DROP COLUMN "createdAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
