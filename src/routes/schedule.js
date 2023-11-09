import Router from "express";
const router = Router();

import validateParams from "../middleware/validate.js";

import {
  create,
  getById,
  updateOne,
  activateMany,
  scheduleBusinessbyService,
  addOrUpdate,
} from "../controllers/schedule.js";

router.post(
  "/",
  validateParams(
    [
      {
        param_key: "service",
        required: true,
        type: "string",
      },
      {
        param_key: "location",
        required: false,
        type: "string",
      },
      {
        param_key: "timeZone",
        required: false,
        type: "string",
      },
      {
        param_key: "schedules",
        required: true,
        type: "array",
      },
    ],
    "body"
  ),
  create
);
//add or update worker schedule
router.post(
  "/add",
  validateParams(
    [
      {
        param_key: "schedules",
        required: true,
        type: "array",
      },
    ],
    "body"
  ),
  addOrUpdate
);

router.get(
  "/businessbyservice",
  validateParams(
    [
      {
        param_key: "service",
        required: true,
        type: "string",
      },
      {
        param_key: "id",
        required: true,
        type: "string",
      },
    ],
    "query"
  ),
  scheduleBusinessbyService
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

router.put(
  "/active/many",
  validateParams(
    [
      {
        param_key: "services",
        required: true,
        type: "array",
      },
    ],
    "body"
  ),
  activateMany
);

export default router;
