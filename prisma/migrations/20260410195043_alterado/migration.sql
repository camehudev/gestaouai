/*
  Warnings:

  - You are about to drop the column `status` on the `PedidoHistorico` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pedido_id]` on the table `PedidoHistorico` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `PedidoHistorico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullCode` to the `PedidoHistorico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `merchantId` to the `PedidoHistorico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `PedidoHistorico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `PedidoHistorico` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PedidoHistorico" DROP COLUMN "status",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "fullCode" TEXT NOT NULL,
ADD COLUMN     "merchantId" TEXT NOT NULL,
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PedidoHistorico_pedido_id_key" ON "PedidoHistorico"("pedido_id");
