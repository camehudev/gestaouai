/*
  Warnings:

  - A unique constraint covering the columns `[pedido_id]` on the table `PedidoHistorico` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PedidoHistorico_pedido_id_key" ON "PedidoHistorico"("pedido_id");
