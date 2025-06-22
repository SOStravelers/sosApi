import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import filesConfig from "../config/files.js";
import multer from "multer";

import {
  create,
  getServices,
  getById,
  updateOne,
  activateMany,
  uploadIconService,
  serviceAndSubservice,
  changeStatus,
} from "../controllers/service.js";
import { getServicesBusiness } from "../controllers/user.js";

const limits = {
  fileSize: filesConfig.profile.maxsize,
};
const fileFilter = (req, file, cb) => {
  let formats = ["image/jpg", "image/jpeg", "image/png", "image/svg"];
  if (!formats.includes(file.mimetype)) {
    cb(createError(400, "Illegal file format."), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  limits,
  fileFilter,
});

router.post(
  "/",
  validateParams(
    [
      {
        param_key: "name",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  create
);
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
  getServices
);
router.get(
  "/get/all/business",
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
  getServicesBusiness
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
router.get("/all/andsubservices", serviceAndSubservice);
router.put(
  "/allData/:id",
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

router.post(
  "/icon",
  validateParams(
    [
      {
        param_key: "type",
        required: false,
        type: "string",
      },
      {
        param_key: "id",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  upload.single("file"),
  uploadIconService
);

//actualizar isActive en un servicio:
router.put(
  "/changeStatus/one/:id",
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
  validateParams(
    [
      {
        param_key: "isActive",
        required: true,
        type: "boolean",
      },
    ],
    "body"
  ),
  changeStatus
);

export default router;
