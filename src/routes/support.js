import Router from "express";
const router = Router();
import {
  supportEmail,
  contactClient,
  johannEmail,
} from "../controllers/support.js";

router.post("/supportEmail", supportEmail);
router.post("/sendRequest", contactClient);
router.post("/johannEmail", johannEmail);

export default router;
