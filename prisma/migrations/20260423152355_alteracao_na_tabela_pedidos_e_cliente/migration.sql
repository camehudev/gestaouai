-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "cliente_id" TEXT;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
