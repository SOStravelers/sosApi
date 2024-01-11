import Router from "express";
const router = Router();
export default router;
import { getByUser } from "../controllers/notification.js";

router.get("/getAll", getByUser);
