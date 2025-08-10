/*
  Warnings:

  - You are about to drop the column `unitPrice` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `shipping` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - Added the required column `unitPriceCents` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountCents` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotalCents` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCents` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPriceCents` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPriceCents` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CartItem" DROP COLUMN "unitPrice",
ADD COLUMN     "unitPriceCents" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Invoice" DROP COLUMN "amount",
ADD COLUMN     "amountCents" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "shipping",
DROP COLUMN "subtotal",
DROP COLUMN "tax",
DROP COLUMN "total",
ADD COLUMN     "shippingCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtotalCents" INTEGER NOT NULL,
ADD COLUMN     "taxCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCents" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "totalPrice",
DROP COLUMN "unitPrice",
ADD COLUMN     "totalPriceCents" INTEGER NOT NULL,
ADD COLUMN     "unitPriceCents" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "price",
ADD COLUMN     "priceCents" INTEGER NOT NULL DEFAULT 0;
