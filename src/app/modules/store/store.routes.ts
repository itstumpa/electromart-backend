// src/app/modules/store/store.routes.ts
import { Router } from "express";
import * as StoreController from "./store.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { createStoreSchema, updateStoreSchema, updateStorePoliciesSchema, } from "./store.validation";
import { getTopVendors } from "./store.controller";
import { upload } from '../../middlewares/upload';
import { parseData } from '../../middlewares/parser';


const router = Router();

// PUBLIC
router.get("/", StoreController.getAllStores)
router.get('/top-vendors', getTopVendors);
router.get("/:id", StoreController.getStoreById);

// VENDOR only
router.post("/", authenticate, authorize("VENDOR"), validate(createStoreSchema), StoreController.createStore);
router.get("/my/store", authenticate, authorize("VENDOR"), StoreController.getMyStore);
// router.patch("/:id", authenticate, authorize("VENDOR"), validate(updateStoreSchema), StoreController.updateStore);

// ADMIN only
router.delete("/:id", authenticate, authorize("ADMIN"), StoreController.deleteStore);



router.patch(
  '/:id',
  authenticate,
  authorize('VENDOR'),
  upload.single('logo'),   // file upload
  parseData,
  validate(updateStoreSchema),
  StoreController.updateStore,
);

router.patch(
  '/:id/policies',
  authenticate,
  authorize('VENDOR'),
  validate(updateStorePoliciesSchema),
  StoreController.updateStorePolicies,
);


router.patch('/:id/pause',           authenticate, authorize('VENDOR'), StoreController.pauseStore);
router.delete('/:id/products',       authenticate, authorize('VENDOR'), StoreController.deleteAllProducts);
router.delete('/:id/close',          authenticate, authorize('VENDOR'), StoreController.closeStore);

export const storeRoute = router;