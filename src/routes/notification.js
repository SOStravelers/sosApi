import Router from "express";
const router = Router();
export default router;
import {
  getByUser,
  setIsRead,
  checkNotification,
  getPublicKey,
  sendExampleNotification,
} from "../controllers/notification.js";
import validateParams from "../middleware/validate.js";
router.get(
  "/getAll",
  validateParams(
    [
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
      {
        param_key: "page",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  getByUser
);
router.get("/checkNotifications", checkNotification);
router.put(
  "/setIsRead/:id",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  setIsRead
);

router.get("/getkey", getPublicKey);
router.post("/createSub", sendExampleNotification);
