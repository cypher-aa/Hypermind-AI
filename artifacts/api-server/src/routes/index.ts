import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import agentsRouter from "./agents";
import geminiRouter from "./gemini";
import memoryRouter from "./memory";
import templatesRouter from "./templates";
import filesRouter from "./files";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(agentsRouter);
router.use(geminiRouter);
router.use(memoryRouter);
router.use(templatesRouter);
router.use(filesRouter);
router.use(dashboardRouter);

export default router;
