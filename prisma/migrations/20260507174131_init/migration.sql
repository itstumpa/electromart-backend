/*
  Warnings:

  - Added the required column `gateway` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "gateway" "PaymentGateway" NOT NULL;
