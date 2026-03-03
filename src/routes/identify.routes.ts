import { Router } from "express";
import { identifyController } from "../controllers/identify.controller";

const router = Router();

router.post("/", identifyController);

export default router;