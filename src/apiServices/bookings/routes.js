import Router from "express";
import validateParams from "../../middleware/validate.js";
import { isAuth } from "../../middleware/auth.js";
import * as BOOKING_CONTROLLERS from "./controllers.js";

const router = Router();

//Crear booking sin usuario logueado
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
//Crear booking usuario logueado
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
//Obtiene info del booking por token para mostrar post compra
router.get(
  "/purchase/data",
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
//Obtienes info de id,foto y name del booking por token
router.get(
  "/dataLink/",
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
  BOOKING_CONTROLLERS.getByTokenMin
);
//Obtienes toda la info booking por usuario registrado
router.get(
  "/mybooking/:id",
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
  isAuth,
  BOOKING_CONTROLLERS.getMyBooking
);
//Obtiene todos los booking de un usuario con multiples filtros
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
  "/client/history",
  validateParams(
    [
      { param_key: "timeZone", required: true, type: "string" },
      { param_key: "isoTime", required: true, type: "string" },
      { param_key: "language", required: true, type: "string" },
      { param_key: "page", required: false, type: "string" },
      { param_key: "limit", required: false, type: "string" },
    ],
    "query"
  ),
  isAuth,
  BOOKING_CONTROLLERS.getBookingHistory
);

router.get(
  "/list/admin-user",
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
  BOOKING_CONTROLLERS.getBookingsByRange
);
//Obtienes info del proximo booking en fecha mas cercana
router.get("/next/client", isAuth, BOOKING_CONTROLLERS.getNextBooking);

//Confirm booking
router.put(
  "/confirm/:id",
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
  BOOKING_CONTROLLERS.confirmBooking
);
//Complete booking
router.put(
  "/complete/:id",
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
  BOOKING_CONTROLLERS.completeBooking
);
//Cancel booking admin
router.put(
  "/cancel/admin/:id",
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
  BOOKING_CONTROLLERS.cancelBooking
);
//Cancel booking user token
router.put(
  "/cancel/id/:id",
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
  BOOKING_CONTROLLERS.cancelBookingToken
);
//Cancel booking user id booking
router.put(
  "/cancel/booking/:id",
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
  BOOKING_CONTROLLERS.cancelBookingId
);
export default router;
