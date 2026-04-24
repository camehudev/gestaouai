/*
  Warnings:

  - A unique constraint covering the columns `[item_pedido]` on the table `Pedido` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PedidoItem" DROP CONSTRAINT "PedidoItem_pedido_id_fkey";

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "item_pedido" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_item_pedido_key" ON "Pedido"("item_pedido");

-- CreateIndex
CREATE INDEX "Pedido_item_pedido_idx" ON "Pedido"("item_pedido");
