import Router from "express";
const router = Router();
import { supportEmail } from "../controllers/support.js";

router.post("/supportEmail", supportEmail);

export default router;