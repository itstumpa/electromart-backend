// src/app/modules/product/product.routes.ts
import { Router } from "express";
import * as ProductController from "./product.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { createProductSchema, updateProductSchema } from "./product.validation";

const router = Router();

// PUBLIC
router.get("/", ProductController.getAllProducts);
router.get("/search", ProductController.searchProducts);
router.get("/search/suggestions", ProductController.getSearchSuggestions);
router.get("/:id", ProductController.getProductById);

// VENDOR only
router.post("/", authenticate, authorize("VENDOR"), validate(createProductSchema), ProductController.createProduct);
router.get("/my/products", authenticate, authorize("VENDOR"), ProductController.getMyProducts);
router.patch("/:id", authenticate, authorize("VENDOR", "ADMIN"), validate(updateProductSchema), ProductController.updateProduct);

// VENDOR + ADMIN
router.delete("/:id", authenticate, authorize("VENDOR", "ADMIN"), ProductController.deleteProduct);

export const productRoute = router;