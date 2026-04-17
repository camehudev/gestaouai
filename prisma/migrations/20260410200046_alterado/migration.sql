/*
  Warnings:

  - Added the required column `status` to the `PedidoHistorico` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PedidoHistorico_pedido_id_key";

-- AlterTable
ALTER TABLE "PedidoHistorico" ADD COLUMN     "status" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PedidoHistorico_tenant_id_idx" ON "PedidoHistorico"("tenant_id");
