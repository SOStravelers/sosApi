import Router from "express";
import {
  create,
  getById,
  getBookings,
  updateOne,
} from "../controllers/booking.js";
import validateParams from "../middleware/validate.js";

const router = Router();

router.post(
  "/",
  validateParams(
    [
      // {
      //   param_key: "location",
      //   required: true,
      //   type: "string",
      // },
      // {
      //   param_key: "subservice",
      //   required: true,
      //   type: "string",
      // },
      {
        param_key: "worker",
        required: true,
        type: "string",
      },
      {
        param_key: "client",
        required: true,
        type: "string",
      },
      {
        param_key: "creator",
        required: true,
        type: "string",
      },
      {
        param_key: "startTime",
        required: true,
        type: "string",
      },
      {
        param_key: "endTime",
        required: true,
        type: "string",
      },
      {
        param_key: "date",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  create
);

router.get(
  "/allBookings/:body",
  validateParams(
    [
      {
        param_key: "body",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  getBookings
);

router.get(
  "/:id",
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
  getById
);

router.put(
  "/:id",
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
  updateOne
);

export default router;
