/*
  Warnings:

  - You are about to drop the column `pedido_id` on the `PedidoItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PedidoItem" DROP CONSTRAINT "PedidoItem_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "PedidoItem" DROP CONSTRAINT "PedidoItem_pedido_id_fkey";

-- AlterTable
ALTER TABLE "PedidoItem" DROP COLUMN "pedido_id";

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("idCliente") ON DELETE SET NULL ON UPDATE CASCADE;
