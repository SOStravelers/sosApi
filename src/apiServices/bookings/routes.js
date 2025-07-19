import Router from "express";
import validateParams from "../../middleware/validate.js";
import { isAuth } from "../../middleware/auth.js";
import * as BOOKING_CONTROLLERS from "./controllers.js";

const router = Router();

router.post(
  "/",
  validateParams(
    [
      {
        param_key: "subservice",
        required: true,
        type: "string",
      },
      {
        param_key: "startTime",
        required: true,
        type: "object",
      },
      {
        param_key: "clientData",
        required: true,
        type: "object",
      },
    ],
    "body"
  ),
  BOOKING_CONTROLLERS.createBooking
);
export default router;
