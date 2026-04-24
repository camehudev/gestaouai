/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `Pedido` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PedidoHistorico_pedido_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_orderId_key" ON "Pedido"("orderId");

-- CreateIndex
CREATE INDEX "Pedido_orderId_idx" ON "Pedido"("orderId");

-- CreateIndex
CREATE INDEX "PedidoHistorico_pedido_id_fullCode_idx" ON "PedidoHistorico"("pedido_id", "fullCode");
