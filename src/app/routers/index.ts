import { Router } from "express";
import { authRoute } from "../modules/auth/auth.routes";
import UserRoutes from "../modules/users/users.routes";
import { storeRoute } from "../modules/store/store.routes";
import { productRoute } from "../modules/product/product.routes";
import { categoryRoute } from "../modules/category/category.routes";
import { orderRoute } from "../modules/order/order.routes";
import { cartRoute } from "../modules/cart/cart.routes";
//import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.use("/auth", authRoute);
// router.use(authenticate);

router.use("/users", UserRoutes);
router.use("/stores", storeRoute);
router.use("/products", productRoute);
router.use("/category", categoryRoute);
router.use("/cart", cartRoute);
router.use("/orders", orderRoute);

export default router;
