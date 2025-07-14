import Router from "express";
const router = Router();
import * as PARTNER_CONTROLLERS from "./controllers.js";

router.post("/infoClient", PARTNER_CONTROLLERS.setIdClient);
router.get("/stats", PARTNER_CONTROLLERS.getClientStats);

export default router;
