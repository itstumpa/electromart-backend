import { Router } from "express";
import * as UserController from "./users.controller";
import { validate } from "../../middlewares/validate";
import { createUserSchema, updateUserSchema } from "./users.validation";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { upload } from '../../middlewares/upload';


const router = Router();

router.get('/me/notification-prefs', authenticate, UserController.getNotificationPrefs);
router.patch('/me/notification-prefs', authenticate, UserController.updateNotificationPrefs);
router.patch('/me/avatar', authenticate, upload.single('avatar'), UserController.uploadAvatar);

router.post("/", validate(createUserSchema), UserController.createUser);
router.get("/", authenticate, authorize("ADMIN"), UserController.getAllUsers);
router.get("/:id", authenticate, authorize("ADMIN"), UserController.getUserById);
router.patch("/:id/ban", authenticate, authorize("ADMIN"), UserController.banUser);
router.patch("/:id", authenticate, validate(updateUserSchema), UserController.updateUser);
router.delete("/:id", authenticate, authorize("ADMIN", "CUSTOMER"), UserController.deleteUser);

export default router;