// src/app/modules/review/review.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import * as ReviewController from './review.controller';
import { createReviewSchema, updateReviewSchema } from './review.validation';

const router = Router();

// PUBLIC
router.get('/product/:productId', ReviewController.getProductReviews);

// CUSTOMER
router.post(
  '/product/:productId',
  authenticate,
  authorize('CUSTOMER'),
  validate(createReviewSchema),
  ReviewController.createReview
);
router.get('/my', authenticate, authorize('CUSTOMER'), ReviewController.getMyReviews);
router.patch('/:reviewId', authenticate, authorize('CUSTOMER'), validate(updateReviewSchema), ReviewController.updateReview);

// CUSTOMER + ADMIN
router.delete('/:reviewId', authenticate, authorize('CUSTOMER', 'ADMIN'), ReviewController.deleteReview);

export const reviewRoute = router;
