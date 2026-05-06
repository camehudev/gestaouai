/*
  Warnings:

  - You are about to drop the column `item_pedido` on the `Pedido` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Pedido_item_pedido_idx";

-- DropIndex
DROP INDEX "Pedido_item_pedido_key";

-- AlterTable
ALTER TABLE "Pedido" DROP COLUMN "item_pedido";
