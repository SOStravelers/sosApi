import Router from "express";
const router = Router();
import validateParams from "../../middleware/validate.js";
import filesConfig from "../../config/files.js";
import multer from "multer";
import * as SERVICE_CONTROLLERS from "./controllers.js";
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
  SERVICE_CONTROLLERS.create
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
  SERVICE_CONTROLLERS.getById
);

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
  SERVICE_CONTROLLERS.updateOne
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
  SERVICE_CONTROLLERS.changeStatus
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
  SERVICE_CONTROLLERS.activateMany
);
router.get("/all/andsubservices", SERVICE_CONTROLLERS.serviceAndSubservice);

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
  SERVICE_CONTROLLERS.uploadIconService
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
  SERVICE_CONTROLLERS.getServices
);
export default router;
