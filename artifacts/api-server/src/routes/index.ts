import { Router, type IRouter } from "express";
import healthRouter from "./health";
import whatsappRouter from "./whatsapp";
import businessRouter from "./business";
import productsRouter from "./products";
import customersRouter from "./customers";
import conversationsRouter from "./conversations";
import ordersRouter from "./orders";
import aiRouter from "./ai";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(whatsappRouter);
router.use(businessRouter);
router.use(productsRouter);
router.use(customersRouter);
router.use(conversationsRouter);
router.use(ordersRouter);
router.use(aiRouter);
router.use(notificationsRouter);
router.use(analyticsRouter);
router.use(settingsRouter);

export default router;
