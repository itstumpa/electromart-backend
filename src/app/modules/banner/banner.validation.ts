import { z } from 'zod';
import { BannerType } from '@prisma/client';

const bannerTypeEnum = z.enum(
  Object.values(BannerType) as [string, ...string[]]
);

const dateOrNull = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Use ISO 8601 format.',
  })
  .optional()
  .nullable();

export const bannerTypeQuerySchema = z.object({
  query: z.object({
    type: bannerTypeEnum,
  }),
});

const commonFields = {
  isActive: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
  startsAt: dateOrNull,
  expiresAt: dateOrNull,
  imageUrl: z.string().optional().nullable(),
  publicId: z.string().optional().nullable(),

  // HOME_HERO_MAIN
  heroTitle: z.string().optional().nullable(),
  heroLabel: z.string().optional().nullable(),
  heroHref: z.string().optional().nullable(),
  heroCtaText: z.string().optional().nullable(),
  heroGradientFrom: z.string().optional().nullable(),
  heroGradientVia: z.string().optional().nullable(),
  heroAccentColor: z.string().optional().nullable(),
  heroCtaBg: z.string().optional().nullable(),

  // HOME_GRID_CELL
  gridLabel: z.string().optional().nullable(),
  gridTitle: z.string().optional().nullable(),
  gridHref: z.string().optional().nullable(),
  gridOffer: z.string().optional().nullable(),
  gridOfferIcon: z.string().optional().nullable(),
  gridGradientFrom: z.string().optional().nullable(),
  gridGradientVia: z.string().optional().nullable(),
  gridBadgeBg: z.string().optional().nullable(),

  // HOME_PILL
  pillLabel: z.string().optional().nullable(),
  pillSub: z.string().optional().nullable(),
  pillIcon: z.string().optional().nullable(),
  pillBg: z.string().optional().nullable(),
  pillShadow: z.string().optional().nullable(),

  // PRODUCT_HERO_SLIDE
  slideBadge: z.string().optional().nullable(),
  slideTitle: z.string().optional().nullable(),
  slideHighlight: z.string().optional().nullable(),
  slideSubtitle: z.string().optional().nullable(),
  slidePrice: z.string().optional().nullable(),
  slideOriginalPrice: z.string().optional().nullable(),
  slideDiscount: z.string().optional().nullable(),
  slideBgGradient: z.string().optional().nullable(),

  // PRODUCT_FLOATING
  floatingName: z.string().optional().nullable(),
  floatingPrice: z.string().optional().nullable(),
  floatingRating: z.coerce.number().optional().nullable(),
  floatingReviews: z.coerce.number().int().optional().nullable(),
};

export const createBannerSchema = z.object({
  body: z.object({
    type: bannerTypeEnum,
    ...commonFields,
  }),
});

export const updateBannerSchema = z.object({
  body: z.object({
    type: bannerTypeEnum.optional(),
    ...commonFields,
  }),
});
