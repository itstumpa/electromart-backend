import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import * as BrandController from './brand.controller';
import { createBrandSchema, updateBrandSchema } from './brand.validation';

const router = Router();

router.get('/', BrandController.getAllBrands);
router.get('/:id', BrandController.getBrandById);

router.post('/', authenticate, authorize('ADMIN'), validate(createBrandSchema), BrandController.createBrand);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateBrandSchema), BrandController.updateBrand);
router.delete('/:id', authenticate, authorize('ADMIN'), BrandController.deleteBrand);

export const brandRoute = router;