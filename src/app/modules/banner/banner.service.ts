import { BannerType, Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { getOrSetCache, invalidateCachePattern } from '../../../utils/cache';
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from '../../../utils/uploadToCloudinary';

const BANNER_CACHE_PREFIX = 'banners:';
const BANNER_CACHE_TTL = 300; // 5 minutes

// ── helpers ──────────────────────────────────────────────────
const toPrismaDate = (
  val: string | null | undefined,
): Date | null | undefined => {
  if (val === null) return null;
  if (val === undefined) return undefined;
  return new Date(val);
};

const collectBannerData = (
  data: Record<string, unknown>,
  imageUrl: string | null,
  publicId: string | null,
): Prisma.BannerCreateInput => {
  const result: Record<string, unknown> = { ...data };
  result.startsAt = toPrismaDate(data.startsAt as string | null | undefined);
  result.expiresAt = toPrismaDate(data.expiresAt as string | null | undefined);
  result.imageUrl = imageUrl ?? (data.imageUrl as string | null) ?? null;
  result.publicId = publicId ?? (data.publicId as string | null) ?? null;
  return result as Prisma.BannerCreateInput;
};

// ── Public ───────────────────────────────────────────────────
export const getActiveBannersByType = (type: BannerType) => {
  const cacheKey = `${BANNER_CACHE_PREFIX}${type}`;
  return getOrSetCache(cacheKey, BANNER_CACHE_TTL, () =>
    prisma.banner.findMany({
      where: {
        type,
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
        ],
      },
      orderBy: { order: 'asc' },
    }),
  );
};

// ── Admin ────────────────────────────────────────────────────
export const getAllBanners = () =>
  prisma.banner.findMany({
    orderBy: [{ type: 'asc' }, { order: 'asc' }],
  });

export const getBannerById = async (id: string) => {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw new ApiError(404, 'Banner not found');
  return banner;
};

export const createBanner = async (
  data: Record<string, unknown>,
  file?: Express.Multer.File,
) => {
  let imageUrl: string | null = null;
  let publicId: string | null = null;

  if (file) {
    const result = await uploadToCloudinary(file.buffer, 'electromart/banners');
    imageUrl = result.secure_url;
    publicId = result.public_id;
  }

  const prismaData = collectBannerData(data, imageUrl, publicId);

  const banner = await prisma.banner.create({ data: prismaData });

  await invalidateCachePattern(`${BANNER_CACHE_PREFIX}*`);
  return banner;
};

export const updateBanner = async (
  id: string,
  data: Record<string, unknown>,
  file?: Express.Multer.File,
) => {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Banner not found');

  let imageUrl: string | null | undefined = data.imageUrl as
    | string
    | null
    | undefined;
  let publicId: string | null | undefined = data.publicId as
    | string
    | null
    | undefined;

  if (file) {
    if (existing.publicId) {
      await deleteFromCloudinary(existing.publicId).catch(() => null);
    }
    const result = await uploadToCloudinary(file.buffer, 'electromart/banners');
    imageUrl = result.secure_url;
    publicId = result.public_id;
  }

  const prismaData = collectBannerData(
    data,
    imageUrl ?? null,
    publicId ?? null,
  );

  const banner = await prisma.banner.update({
    where: { id },
    data: prismaData,
  });

  await invalidateCachePattern(`${BANNER_CACHE_PREFIX}*`);
  return banner;
};

export const deleteBanner = async (id: string) => {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Banner not found');

  if (existing.publicId) {
    await deleteFromCloudinary(existing.publicId).catch(() => null);
  }

  await prisma.banner.delete({ where: { id } });

  await invalidateCachePattern(`${BANNER_CACHE_PREFIX}*`);
};
