/*
  Warnings:

  - You are about to drop the column `clienteDoc` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `clienteFone` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `clienteNome` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `displayId` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `json_bruto` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `subTotal` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `taxaEntrega` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `valorTotal` on the `Pedido` table. All the data in the column will be lost.
  - Added the required column `code` to the `Pedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullCode` to the `Pedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `merchantId` to the `Pedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pedido" DROP COLUMN "clienteDoc",
DROP COLUMN "clienteFone",
DROP COLUMN "clienteNome",
DROP COLUMN "displayId",
DROP COLUMN "json_bruto",
DROP COLUMN "status",
DROP COLUMN "subTotal",
DROP COLUMN "taxaEntrega",
DROP COLUMN "valorTotal",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "fullCode" TEXT NOT NULL,
ADD COLUMN     "merchantId" TEXT NOT NULL,
ADD COLUMN     "orderId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Pedido_merchantId_idx" ON "Pedido"("merchantId");
