// src/app/modules/product/product.routes.ts
import { Router } from "express";
import * as ProductController from "./product.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { createProductSchema, updateProductSchema } from "./product.validation";
import { upload } from "../../middlewares/upload";
import * as ProductImageController from "./product.controller";
import { searchLimiter } from "../../middlewares/rateLimiter";


const router = Router();

// PUBLIC
router.get("/", ProductController.getAllProducts);
router.get("/search", searchLimiter, ProductController.searchProducts);
router.get("/search/suggestions", ProductController.getSearchSuggestions);
router.get("/:id", ProductController.getProductById);
router.get("/:id", ProductController.getProductById);
router.get("/recently-viewed", authenticate, ProductController.getRecentlyViewedProducts);

// VENDOR only
router.post("/", authenticate, authorize("VENDOR"), validate(createProductSchema), ProductController.createProduct);
router.get("/my/products", authenticate, authorize("VENDOR"), ProductController.getMyProducts);
router.patch("/:id", authenticate, authorize("VENDOR", "ADMIN"), validate(updateProductSchema), ProductController.updateProduct);

// VENDOR — upload product images (max 5 at once)
router.post(
  "/:id/images",
  authenticate,
  authorize("VENDOR"),
  upload.array("images", 5),
  ProductImageController.uploadProductImages
);

// VENDOR — delete a product image
router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("VENDOR"),
  ProductImageController.deleteProductImage
);

// VENDOR + ADMIN
router.delete("/:id", authenticate, authorize("VENDOR", "ADMIN"), ProductController.deleteProduct);

export const productRoute = router;