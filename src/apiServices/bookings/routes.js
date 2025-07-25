import Router from "express";
import validateParams from "../../middleware/validate.js";
import { isAuth } from "../../middleware/auth.js";
import * as BOOKING_CONTROLLERS from "./controllers.js";

const router = Router();

router.post(
  "/noAuth/create",
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
router.post(
  "/create",
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
  isAuth,
  BOOKING_CONTROLLERS.createBooking
);

router.get(
  "/getdata/",
  validateParams(
    [
      {
        param_key: "token",
        required: true,
        type: "string",
      },
    ],
    "query"
  ),
  BOOKING_CONTROLLERS.getByToken
);

router.get(
  "/list/client",
  validateParams(
    [
      {
        param_key: "timeZone",
        required: true,
        type: "string",
      },
      {
        param_key: "isoTime",
        required: true,
        type: "string",
      },
      {
        param_key: "language",
        required: true,
        type: "string",
      },
      {
        param_key: "range",
        required: true,
        type: "string",
      },
    ],
    "query"
  ),
  isAuth,
  BOOKING_CONTROLLERS.getBookingsByRange
);

router.get(
  "/next/client",

  isAuth,
  BOOKING_CONTROLLERS.getNextBooking
);
export default router;
