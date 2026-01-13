-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MERCHANT', 'ADMIN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MTN', 'VODAFONE', 'AIRTELTIGO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "password_reset_at" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'MERCHANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_links" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "expires_after_days" INTEGER,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payment_link_id" TEXT NOT NULL,
    "external_reference" TEXT NOT NULL,
    "provider_transaction_id" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "PaymentProvider" NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "failure_reason" TEXT,
    "provider_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "pdf_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "products_user_id_idx" ON "products"("user_id");

-- CreateIndex
CREATE INDEX "products_user_id_deleted_at_idx" ON "products"("user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_links_slug_key" ON "payment_links"("slug");

-- CreateIndex
CREATE INDEX "payment_links_user_id_idx" ON "payment_links"("user_id");

-- CreateIndex
CREATE INDEX "payment_links_slug_idx" ON "payment_links"("slug");

-- CreateIndex
CREATE INDEX "payment_links_user_id_is_active_idx" ON "payment_links"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "payment_links_expires_at_idx" ON "payment_links"("expires_at");

-- CreateIndex
CREATE INDEX "payment_links_is_active_expires_at_idx" ON "payment_links"("is_active", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_external_reference_key" ON "transactions"("external_reference");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_payment_link_id_idx" ON "transactions"("payment_link_id");

-- CreateIndex
CREATE INDEX "transactions_external_reference_idx" ON "transactions"("external_reference");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_user_id_status_idx" ON "transactions"("user_id", "status");

-- CreateIndex
CREATE INDEX "transactions_provider_transaction_id_idx" ON "transactions"("provider_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_transaction_id_key" ON "receipts"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "receipts_transaction_id_idx" ON "receipts"("transaction_id");

-- CreateIndex
CREATE INDEX "receipts_receipt_number_idx" ON "receipts"("receipt_number");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_link_id_fkey" FOREIGN KEY ("payment_link_id") REFERENCES "payment_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
