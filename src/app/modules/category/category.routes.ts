// src/app/modules/category/category.routes.ts
import { Router } from "express";
import * as CategoryController from "./category.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { createCategorySchema, updateCategorySchema } from "./category.validation";

const router = Router();

// PUBLIC
router.get("/", CategoryController.getAllCategories);
router.get("/featured", CategoryController.getFeaturedCategories);
router.get("/slug/:slug", CategoryController.getCategoryBySlug);
router.get("/:id", CategoryController.getCategoryById);

// ADMIN only
router.post("/", authenticate, authorize("ADMIN"), validate(createCategorySchema), CategoryController.createCategory);
router.patch("/:id", authenticate, authorize("ADMIN"), validate(updateCategorySchema), CategoryController.updateCategory);
router.delete("/:id", authenticate, authorize("ADMIN"), CategoryController.deleteCategory);

export const categoryRoute = router;