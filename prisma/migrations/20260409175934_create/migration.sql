/*
  Warnings:

  - You are about to drop the `Produto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_tenant_id_fkey";

-- DropTable
DROP TABLE "Produto";

-- CreateTable
CREATE TABLE "Catalog" (
    "id" TEXT NOT NULL,
    "catalog" JSONB,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "idCategoryUai" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "externalId" TEXT,
    "index" TEXT,
    "template" TEXT,
    "status" TEXT,
    "items" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "catalogId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Catalog_empresaId_idx" ON "Catalog"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_externalId_key" ON "Category"("externalId");

-- CreateIndex
CREATE INDEX "Category_catalogId_idx" ON "Category"("catalogId");

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
