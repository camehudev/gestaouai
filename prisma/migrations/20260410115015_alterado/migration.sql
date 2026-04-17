/*
  Warnings:

  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_CustomerToPedidoItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADM_BD', 'ADM_EMPRESA', 'OPERADOR', 'USER');

-- DropForeignKey
ALTER TABLE "_CustomerToPedidoItem" DROP CONSTRAINT "_CustomerToPedidoItem_A_fkey";

-- DropForeignKey
ALTER TABLE "_CustomerToPedidoItem" DROP CONSTRAINT "_CustomerToPedidoItem_B_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "_CustomerToPedidoItem";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "CustomerToPedidoItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CustomerToPedidoItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CustomerToPedidoItem_B_index" ON "CustomerToPedidoItem"("B");

-- AddForeignKey
ALTER TABLE "CustomerToPedidoItem" ADD CONSTRAINT "_CustomerToPedidoItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerToPedidoItem" ADD CONSTRAINT "_CustomerToPedidoItem_B_fkey" FOREIGN KEY ("B") REFERENCES "PedidoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
