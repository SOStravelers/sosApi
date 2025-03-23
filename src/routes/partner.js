import Router from "express";
const router = Router();
import { setIdClient, getClientStats } from "../controllers/partner.js";

router.post("/infoClient", setIdClient);
router.get("/stats", getClientStats);

export default router;
