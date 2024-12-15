import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";

import {
  create,
  getById,
  updateOne,
  activateMany,
  getByService,
  getAll,
  getPrice,
  infoSubserviceByWorker,
} from "../controllers/subservice.js";

//Create subService
router.post(
  "/",
  validateParams(
    [
      {
        param_key: "name",
        required: true,
        type: "string",
      },
      {
        param_key: "service",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  create
);
//Get subServices by Service
router.get(
  "/byService",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string", // Dependiendo de si limit es un número o no
      },
      {
        param_key: "page",
        required: false,
        type: "string", // Dependiendo de si page es un número o no
      },
    ],
    "query"
  ),
  getByService
);
//Get subservice by ID
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
//Get all services
router.get(
  "/get/all",
  validateParams(
    [
      {
        param_key: "isActive",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string", // Dependiendo de si limit es un número o no
      },
      {
        param_key: "page",
        required: false,
        type: "string", // Dependiendo de si page es un número o no
      },
    ],
    "query"
  ),
  getAll
);
//update subservice
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
//Obtener los precios actuaales
router.get(
  "/prices/business",
  validateParams(
    [
      {
        param_key: "subservice",
        required: true,
        type: "string",
      },
      {
        param_key: "user",
        required: true,
        type: "string",
      },
    ],
    "query"
  ),
  getPrice
);

//Obtener los precios actuaales
router.get(
  "/data/byWorker/",
  validateParams(
    [
      {
        param_key: "subservice",
        required: true,
        type: "string",
      },
      {
        param_key: "user",
        required: true,
        type: "string",
      },
    ],
    "query"
  ),
  infoSubserviceByWorker
);

export default router;
