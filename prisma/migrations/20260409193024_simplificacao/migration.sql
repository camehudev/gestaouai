/*
  Warnings:

  - You are about to drop the column `externalId` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `obs` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `precoTotal` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `precoUnit` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantidade` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the `PedidoItemOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PedidoPagamento` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PedidoItemOption" DROP CONSTRAINT "PedidoItemOption_pedido_item_id_fkey";

-- DropForeignKey
ALTER TABLE "PedidoPagamento" DROP CONSTRAINT "PedidoPagamento_pedido_id_fkey";

-- AlterTable
ALTER TABLE "PedidoItem" DROP COLUMN "externalId",
DROP COLUMN "nome",
DROP COLUMN "obs",
DROP COLUMN "precoTotal",
DROP COLUMN "precoUnit",
DROP COLUMN "quantidade",
ADD COLUMN     "createdAt" TEXT,
ADD COLUMN     "delivery" JSONB,
ADD COLUMN     "displayId" TEXT,
ADD COLUMN     "idUaiRango" TEXT,
ADD COLUMN     "isTest" BOOLEAN,
ADD COLUMN     "items" JSONB,
ADD COLUMN     "orderTiming" TEXT,
ADD COLUMN     "orderType" TEXT,
ADD COLUMN     "salesChannel" TEXT,
ADD COLUMN     "total" JSONB;

-- DropTable
DROP TABLE "PedidoItemOption";

-- DropTable
DROP TABLE "PedidoPagamento";

-- CreateTable
CREATE TABLE "Payments" (
    "id" TEXT NOT NULL,
    "prepaid" BOOLEAN NOT NULL DEFAULT false,
    "pending" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "methods" JSONB,
    "pedidoItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "idCliente" TEXT,
    "name" TEXT NOT NULL,
    "documentNumber" TEXT,
    "ordersCountOnMerchant" INTEGER NOT NULL DEFAULT 0,
    "phones" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CustomerToPedidoItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CustomerToPedidoItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Payments_pedidoItemId_idx" ON "Payments"("pedidoItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_idCliente_key" ON "Customer"("idCliente");

-- CreateIndex
CREATE INDEX "Customer_idCliente_idx" ON "Customer"("idCliente");

-- CreateIndex
CREATE INDEX "_CustomerToPedidoItem_B_index" ON "_CustomerToPedidoItem"("B");

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_pedidoItemId_fkey" FOREIGN KEY ("pedidoItemId") REFERENCES "PedidoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerToPedidoItem" ADD CONSTRAINT "_CustomerToPedidoItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerToPedidoItem" ADD CONSTRAINT "_CustomerToPedidoItem_B_fkey" FOREIGN KEY ("B") REFERENCES "PedidoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
