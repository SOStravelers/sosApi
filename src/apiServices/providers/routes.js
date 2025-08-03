import Router from "express";
const router = Router();
import multer from "multer";
import validateParams from "../../middleware/validate.js";
import * as PROVIDER_CONTROLLERS from "./controllers.js";
import { isValidImage } from "../../config/uploadTypes.js";
import { createError } from "../../config/error.js";

// multer en memoria, límite general 50MB por archivo
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter(req, file, cb) {
    const { fieldname, mimetype } = file;

    // 1️⃣ campos de imagen
    if (["imgUrl", "galleryImages"].includes(fieldname)) {
      if (!isValidImage(mimetype)) {
        return cb(createError(415, `Unsupported image type: ${mimetype}`));
      }
    }
    cb(null, true); // aceptar archivo
  },
});

//Crear Proveedor
router.post(
  "/",
  validateParams(
    [
      {
        param_key: "name",
        required: true,
        type: "object",
      },
      {
        param_key: "email",
        required: true,
        type: "string",
      },
      {
        param_key: "phoneCode",
        required: true,
        type: "string",
      },
      {
        param_key: "phone",
        required: true,
        type: "string",
      },
      {
        param_key: "phoneCountry",
        required: true,
        type: "string",
      },
      {
        param_key: "user",
        required: false,
        type: "string",
      },
    ],
    "body"
  ),
  upload.fields([{ name: "imgUrl", maxCount: 1 }]),
  PROVIDER_CONTROLLERS.createProvider
);
//Actualizar data del proveedor
router.put(
  "/data/:id",
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
        param_key: "phoneCode",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  PROVIDER_CONTROLLERS.updateDataProvider
);

//Obtener por id
router.get(
  "/byId/:id",
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
  PROVIDER_CONTROLLERS.getProviderById
);
//Actualizar imagen del proveedor
router.put(
  "/img/:id",
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
  upload.fields([{ name: "imgUrl", maxCount: 1 }]),
  PROVIDER_CONTROLLERS.updateImgProvider
);
//Cambiar estado del proveedor
router.put(
  "/active/:id",
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
  PROVIDER_CONTROLLERS.activeProvider
);

export default router;
