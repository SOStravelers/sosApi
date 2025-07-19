import Router from "express";
const router = Router();
import validateParams from "../../middleware/validate.js";
import * as NOTIFICATION_CONTROLLERS from "./controllers.js";
import { isAuth } from "../../middleware/auth.js";

router.get(
  "/getAll",
  isAuth,
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
  NOTIFICATION_CONTROLLERS.getByUser
);
router.put(
  "/setIsRead/:id",
  isAuth,
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
  NOTIFICATION_CONTROLLERS.setIsRead
);
router.get(
  "/checkNotifications",
  isAuth,
  NOTIFICATION_CONTROLLERS.checkNotification
);
// router.get("/getkey", NOTIFICATION_CONTROLLERS.getPublicKey);
// router.post("/createSub", NOTIFICATION_CONTROLLERS.sendExampleNotification);

export default router;
