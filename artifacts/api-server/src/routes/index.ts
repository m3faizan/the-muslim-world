import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sitesRouter from "./sites";
import authRouter from "./auth";
import hotspotsRouter from "./hotspots";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(hotspotsRouter);
router.use(sitesRouter);

export default router;
