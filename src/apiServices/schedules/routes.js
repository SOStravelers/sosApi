import Router from "express";
const router = Router();
import validateParams from "../../middleware/validate.js";
import * as SCHEDULE_CONTROLLERS from "./controllers.js";

//POST ITEMS WITH PRODUCTS IN A SUBSERVICE
router.get(
  "/get/bysubservice",
  validateParams(
    [
      {
        param_key: "businessId",
        required: true,
        type: "string",
      },
      {
        param_key: "serviceId",
        required: true,
        type: "string",
      },
      {
        param_key: "subserviceId",
        required: true,
        type: "string",
      },
      {
        param_key: "workerId",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  SCHEDULE_CONTROLLERS.businessSchedule
);
export default router;
