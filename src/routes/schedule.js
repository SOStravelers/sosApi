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
  getByUser,
  addUpdateDefault,
  addOrUpdateBusiness,
  getScheduleByBusiness,
} from "../controllers/schedule.js";

router.get(
  "/business/:id",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string"
      }
    ],
    "params"
  ),
  getScheduleByBusiness
);

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
router.post("/addbusiness", addOrUpdate);
//add or update business schedule
router.post(
  "/addBusiness",
  validateParams(
    [
      {
        param_key: "service",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  addOrUpdateBusiness
);
//get By user
router.get("/template", addUpdateDefault);
router.get("/get", getByUser);

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
