import { Router } from "express";
import * as UserController from "./users.controller";
import { validate } from "../../middlewares/validate";
import { createUserSchema, updateUserSchema } from "./users.validation";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";

const router = Router();

router.post("/", validate(createUserSchema), UserController.createUser);
router.get("/", authenticate, authorize("ADMIN"), UserController.getAllUsers);
router.get("/:id", authenticate, authorize("ADMIN"), UserController.getUserById);
router.patch("/:id", validate(updateUserSchema), UserController.updateUser);
router.delete("/:id", authenticate, authorize("ADMIN", "CUSTOMER"), UserController.deleteUser);

export default router;