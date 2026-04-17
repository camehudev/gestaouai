/*
  Warnings:

  - A unique constraint covering the columns `[pedido_id]` on the table `PedidoHistorico` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PedidoHistorico" DROP CONSTRAINT "PedidoHistorico_pedido_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "PedidoHistorico_pedido_id_key" ON "PedidoHistorico"("pedido_id");

-- AddForeignKey
ALTER TABLE "PedidoHistorico" ADD CONSTRAINT "PedidoHistorico_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("uairango_id") ON DELETE RESTRICT ON UPDATE CASCADE;
