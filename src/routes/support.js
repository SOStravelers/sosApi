import Router from "express";
const router = Router();
import { supportEmail, contactClient } from "../controllers/support.js";

router.post("/supportEmail", supportEmail);
router.post("/sendRequest", contactClient);

export default router;
