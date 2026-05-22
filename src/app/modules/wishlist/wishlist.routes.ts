import { Router } from "express";
import * as WishlistController from "./wishlist.controller";
import { productIdParamSchema } from "./wishlist.validation";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

const router = Router();

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
