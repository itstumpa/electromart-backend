import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { upload } from '../../middlewares/upload';
import { parseData } from '../../middlewares/parser';
import { validate } from '../../middlewares/validate';
import * as BannerController from './banner.controller';
import {
  bannerTypeQuerySchema,
  createBannerSchema,
  updateBannerSchema,
} from './banner.validation';

// ── Public Router ────────────────────────────────────────────
const publicRouter = Router();

publicRouter.get(
  '/',
  validate(bannerTypeQuerySchema),
  BannerController.getActiveBannersByType,
);

// ── Admin Router ─────────────────────────────────────────────
const adminRouter = Router();

adminRouter.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

adminRouter.get('/', BannerController.getAllBanners);
adminRouter.get('/:id', BannerController.getBannerById);

adminRouter.post(
  '/',
  upload.single('image'),
  parseData,
  validate(createBannerSchema),
  BannerController.createBanner,
);

adminRouter.patch(
  '/:id',
  upload.single('image'),
  parseData,
  validate(updateBannerSchema),
  BannerController.updateBanner,
);

adminRouter.delete('/:id', BannerController.deleteBanner);

export const bannerRoute = publicRouter;
export const bannerAdminRoute = adminRouter;
