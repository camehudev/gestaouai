/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `Pedido` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pedido_orderId_key" ON "Pedido"("orderId");
