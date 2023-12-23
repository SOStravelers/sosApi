import Router from "express";
const router = Router();

import validateParams from "../middleware/validate.js";

import {
  create,
  getById,
  updateOne,
  activateMany,
  getByUser,
  addUpdateDefault,
  addOrUpdateBusiness,
  addOrUpdateWorker,
  businessSchedule,
} from "../controllers/schedule.js";

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
// Add or update worker schedule
router.post(
  "/addWorker",
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
  addOrUpdateWorker
);
// Add or update business schedule
router.post(
  "/addBusiness",
  validateParams(
    [
      {
        param_key: "service",
        required: true,
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
  addOrUpdateBusiness
);
//Obtener calendario flujo principal
router.get(
  "/business/:businessId/service/:serviceId/subservice/:subserviceId/worker/:workerId",
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
  businessSchedule
);
//Actualizar schedule default
router.get("/template", addUpdateDefault);

router.get("/get", getByUser);

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
