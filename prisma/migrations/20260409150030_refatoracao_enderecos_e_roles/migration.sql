-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADM_BD', 'ADM_EMPRESA', 'OPERADOR', 'USER');

-- CreateEnum
CREATE TYPE "PedidoStatus" AS ENUM ('RECEIVED', 'CONFIRMED', 'DISPATCHED', 'READY', 'CANCELLED', 'PENDING', 'SHIPPED', 'DELIVERED', 'READY_TO_PICKUP', 'ORDER_NEW', 'PLACED');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "tenant_id" TEXT,
    "uaiMerchantId" TEXT,
    "configUaiRango" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpresaEndereco" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" VARCHAR(2) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmpresaEndereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "externalCode" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "informacaoAdicional" TEXT,
    "serving" TEXT,
    "peso" DOUBLE PRECISION,
    "tenant_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "uairango_id" TEXT NOT NULL,
    "displayId" TEXT,
    "status" "PedidoStatus" NOT NULL DEFAULT 'RECEIVED',
    "valorTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "subTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "taxaEntrega" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "clienteNome" TEXT,
    "clienteDoc" TEXT,
    "clienteFone" TEXT,
    "tenant_id" TEXT NOT NULL,
    "json_bruto" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoEndereco" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "pontoReferencia" TEXT,
    "formatadoUai" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoEndereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "externalId" TEXT,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnit" DECIMAL(10,2) NOT NULL,
    "precoTotal" DECIMAL(10,2) NOT NULL,
    "obs" TEXT,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItemOption" (
    "id" TEXT NOT NULL,
    "pedido_item_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnit" DECIMAL(10,2) NOT NULL,
    "precoTotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PedidoItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoPagamento" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "metodo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "bandeira" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "prepaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PedidoPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoHistorico" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "EmpresaEndereco_empresaId_key" ON "EmpresaEndereco"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_externalId_key" ON "Produto"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_uairango_id_key" ON "Pedido"("uairango_id");

-- CreateIndex
CREATE INDEX "Pedido_tenant_id_idx" ON "Pedido"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoEndereco_pedidoId_key" ON "PedidoEndereco"("pedidoId");

-- CreateIndex
CREATE INDEX "PedidoHistorico_pedido_id_idx" ON "PedidoHistorico"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_empresaId_idx" ON "users"("empresaId");

-- AddForeignKey
ALTER TABLE "EmpresaEndereco" ADD CONSTRAINT "EmpresaEndereco_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoEndereco" ADD CONSTRAINT "PedidoEndereco_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItemOption" ADD CONSTRAINT "PedidoItemOption_pedido_item_id_fkey" FOREIGN KEY ("pedido_item_id") REFERENCES "PedidoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoPagamento" ADD CONSTRAINT "PedidoPagamento_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoHistorico" ADD CONSTRAINT "PedidoHistorico_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
