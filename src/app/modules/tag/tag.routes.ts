import { Router } from "express";
import * as TagController from "./tag.controller";

import { createTagSchema, addTagsToProductSchema } from "./tag.validation";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

const router = Router();

router.get("/",                                TagController.getAllTags);
router.get("/:slug/products",                  TagController.getProductsByTag);
router.post("/", authenticate, authorize("ADMIN"), validate(createTagSchema), TagController.createTag);
router.delete("/:id", authenticate, authorize("ADMIN"), TagController.deleteTag);
router.post("/product/:productId", authenticate, authorize("VENDOR"), validate(addTagsToProductSchema), TagController.addTagsToProduct);
router.delete("/product/:productId/:tagId", authenticate, authorize("VENDOR"), TagController.removeTagFromProduct);

export const tagRoute = router;