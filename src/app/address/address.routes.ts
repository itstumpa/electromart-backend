// src/app/modules/address/address.routes.ts
import { Router } from "express";
import * as AddressController from "./address.controller";
import { createAddressSchema, updateAddressSchema } from "./address.validation";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";

const router = Router();
router.use(authenticate);

router.get("/",              AddressController.getMyAddresses);
router.post("/",             validate(createAddressSchema), AddressController.createAddress);
router.get("/:id",           AddressController.getAddressById);
router.patch("/:id",         validate(updateAddressSchema), AddressController.updateAddress);
router.delete("/:id",        AddressController.deleteAddress);
router.patch("/:id/default", AddressController.setDefaultAddress);

export const addressRoute = router;