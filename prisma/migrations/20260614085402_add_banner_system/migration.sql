-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HOME_HERO_MAIN', 'HOME_GRID_CELL', 'HOME_PILL', 'PRODUCT_HERO_SLIDE', 'PRODUCT_FLOATING');

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "type" "BannerType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "publicId" TEXT,
    "heroTitle" TEXT,
    "heroLabel" TEXT,
    "heroHref" TEXT,
    "heroCtaText" TEXT,
    "heroGradientFrom" TEXT,
    "heroGradientVia" TEXT,
    "heroAccentColor" TEXT,
    "heroCtaBg" TEXT,
    "gridLabel" TEXT,
    "gridTitle" TEXT,
    "gridHref" TEXT,
    "gridOffer" TEXT,
    "gridOfferIcon" TEXT,
    "gridGradientFrom" TEXT,
    "gridGradientVia" TEXT,
    "gridBadgeBg" TEXT,
    "pillLabel" TEXT,
    "pillSub" TEXT,
    "pillIcon" TEXT,
    "pillBg" TEXT,
    "pillShadow" TEXT,
    "slideBadge" TEXT,
    "slideTitle" TEXT,
    "slideHighlight" TEXT,
    "slideSubtitle" TEXT,
    "slidePrice" TEXT,
    "slideOriginalPrice" TEXT,
    "slideDiscount" TEXT,
    "slideBgGradient" TEXT,
    "floatingName" TEXT,
    "floatingPrice" TEXT,
    "floatingRating" DOUBLE PRECISION,
    "floatingReviews" INTEGER,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_type_isActive_idx" ON "Banner"("type", "isActive");

-- CreateIndex
CREATE INDEX "Banner_type_order_idx" ON "Banner"("type", "order");
