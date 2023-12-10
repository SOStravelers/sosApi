import Router from "express";
const router = Router();

import validateParams from "../middleware/validate.js";

import {
  create,
  getById,
  updateOne,
  activateMany,
  scheduleBusinessbyService,
  getByUser,
  addUpdateDefault,
  addOrUpdateBusiness,
  scheduleByBusiness,
  addOrUpdateWorker,
  workerScheduleForBook,
} from "../controllers/schedule.js";

//Obtener calendario flujo principal
router.get(
  "/business/:businessId/service/:serviceId/subservice/:subserviceId",
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
    ],
    "params"
  ),
  scheduleByBusiness
);

router.get(
  "/worker/:workerId/service/:serviceId/subservice/:subserviceId",
  validateParams(
    [
      {
        param_key: "workerId",
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
      }
    ],
    "params"
  ),
  workerScheduleForBook
);

//Crear Calendario
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
// //add or update worker schedule
router.post("/addWorker", addOrUpdateWorker);
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
