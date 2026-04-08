import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "./auth";
import { menuRouter } from "./menu";
import { cartRouter } from "./cart";
import { ordersRouter } from "./orders";
import { reservationsRouter } from "./reservations";
import { productsRouter } from "./products";
import { shopCartRouter } from "./shopCart";
import { shopOrdersRouter } from "./shopOrders";
import { eventsRouter } from "./events";
import { loyaltyRouter } from "./loyalty";
import { profileRouter } from "./profile";
import { reviewsRouter } from "./reviews";
import { adminRouter } from "./admin";
import { paymentsRouter } from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/menu", menuRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/reservations", reservationsRouter);
router.use("/products", productsRouter);
router.use("/shop/cart", shopCartRouter);
router.use("/shop/orders", shopOrdersRouter);
router.use("/events", eventsRouter);
router.use("/loyalty", loyaltyRouter);
router.use("/profile", profileRouter);
router.use("/reviews", reviewsRouter);
router.use("/admin", adminRouter);
router.use("/payments", paymentsRouter);

export default router;
