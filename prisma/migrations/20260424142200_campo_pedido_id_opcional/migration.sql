-- DropForeignKey
ALTER TABLE "PedidoItem" DROP CONSTRAINT "PedidoItem_pedido_id_fkey";

-- AlterTable
ALTER TABLE "PedidoItem" ALTER COLUMN "pedido_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
