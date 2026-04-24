/*
  Warnings:

  - A unique constraint covering the columns `[idUaiRango]` on the table `PedidoItem` will be added. If there are existing duplicate values, this will fail.
  - Made the column `idUaiRango` on table `PedidoItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Pedido_orderId_idx";

-- DropIndex
DROP INDEX "Pedido_orderId_key";

-- AlterTable
ALTER TABLE "PedidoItem" ALTER COLUMN "idUaiRango" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PedidoItem_idUaiRango_key" ON "PedidoItem"("idUaiRango");
