import { Router } from "express";
import * as WishlistController from "./wishlist.controller";
import { productIdParamSchema } from "./wishlist.validation";
import { authenticate } from "../../middlewares/authenticate";
import { optionalAuth } from "../../middlewares/guest";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

const router = Router();

// ── Guest wishlist routes (no auth required) ─────────────────────────────────
router.get("/guest", optionalAuth, WishlistController.getWishlist);
router.delete("/guest", optionalAuth, WishlistController.clearWishlist);
router.get("/guest/check/:productId", optionalAuth, validate(productIdParamSchema), WishlistController.checkWishlistItem);
router.post("/guest/:productId", optionalAuth, validate(productIdParamSchema), WishlistController.addToWishlist);
router.delete("/guest/:productId", optionalAuth, validate(productIdParamSchema), WishlistController.removeFromWishlist);

// ── Authenticated wishlist routes (customers only) ───────────────────────────
router.use(authenticate, authorize("CUSTOMER"));

router.get("/", WishlistController.getWishlist);
router.delete("/", WishlistController.clearWishlist);
router.get(
  "/check/:productId",
  validate(productIdParamSchema),
  WishlistController.checkWishlistItem,
);
router.post(
  "/:productId",
  validate(productIdParamSchema),
  WishlistController.addToWishlist,
);
router.delete(
  "/:productId",
  validate(productIdParamSchema),
  WishlistController.removeFromWishlist,
);

export const wishlistRoute = router;
