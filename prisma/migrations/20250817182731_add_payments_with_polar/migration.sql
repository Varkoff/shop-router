/*
  Warnings:

  - You are about to drop the column `stripeInvoiceId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCheckoutSession` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `stripeInvoiceId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stripeProductId` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[polarInvoiceId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[polarProductId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[polarPriceId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `polarInvoiceId` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Invoice_stripeInvoiceId_key";

-- DropIndex
DROP INDEX "public"."Product_stripePriceId_key";

-- DropIndex
DROP INDEX "public"."Product_stripeProductId_key";

-- AlterTable
ALTER TABLE "public"."Invoice" DROP COLUMN "stripeInvoiceId",
ADD COLUMN     "polarInvoiceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "stripeCheckoutSession",
DROP COLUMN "stripeInvoiceId",
DROP COLUMN "stripePaymentIntentId",
ADD COLUMN     "polarCheckoutSession" TEXT,
ADD COLUMN     "polarInvoiceId" TEXT,
ADD COLUMN     "polarPaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "stripePriceId",
ADD COLUMN     "polarPriceId" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "stripePriceId",
DROP COLUMN "stripeProductId",
ADD COLUMN     "polarPriceId" TEXT,
ADD COLUMN     "polarProductId" TEXT;

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "polarCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_polarInvoiceId_key" ON "public"."Invoice"("polarInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_polarProductId_key" ON "public"."Product"("polarProductId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_polarPriceId_key" ON "public"."Product"("polarPriceId");
