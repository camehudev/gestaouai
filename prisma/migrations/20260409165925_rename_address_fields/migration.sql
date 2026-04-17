/*
  Warnings:

  - You are about to drop the column `bairro` on the `EmpresaEndereco` table. All the data in the column will be lost.
  - You are about to drop the column `cep` on the `EmpresaEndereco` table. All the data in the column will be lost.
  - You are about to drop the column `cidade` on the `EmpresaEndereco` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `EmpresaEndereco` table. All the data in the column will be lost.
  - You are about to drop the column `logradouro` on the `EmpresaEndereco` table. All the data in the column will be lost.
  - You are about to drop the column `numero` on the `EmpresaEndereco` table. All the data in the column will be lost.
  - Added the required column `city` to the `EmpresaEndereco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `EmpresaEndereco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `EmpresaEndereco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `EmpresaEndereco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `EmpresaEndereco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `EmpresaEndereco` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmpresaEndereco" DROP COLUMN "bairro",
DROP COLUMN "cep",
DROP COLUMN "cidade",
DROP COLUMN "estado",
DROP COLUMN "logradouro",
DROP COLUMN "numero",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Brasil',
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "street" TEXT NOT NULL;
