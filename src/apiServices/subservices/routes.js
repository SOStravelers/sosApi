import Router from "express";
const router = Router();
import multer from "multer";
import validateParams from "../../middleware/validate.js";
import { isAuth } from "../../middleware/auth.js";
import * as SERVICE_CONTROLLERS from "./controllers.js";
import { isValidImage, isValidVideo } from "../../config/uploadTypes.js";
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

    // 2️⃣ campos de vídeo
    if (["videoUrl", "galleryVideos"].includes(fieldname)) {
      if (!isValidVideo(mimetype)) {
        return cb(createError(415, `Unsupported video type: ${mimetype}`));
      }
    }

    cb(null, true); // aceptar archivo
  },
});

//Create subService
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
        param_key: "service",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  SERVICE_CONTROLLERS.create
);

//Get all services
router.get(
  "/getAll/paginate",
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
  SERVICE_CONTROLLERS.getAll
);

router.get(
  "/getproducts",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
      {
        param_key: "date",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  SERVICE_CONTROLLERS.getProductCategoriesAndProducts
);
//con auth para ademas obtener favoritos
router.get(
  "/getAll/user/paginate",
  isAuth,
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
  SERVICE_CONTROLLERS.getAll
);

//Get sugerencias con videos
router.get("/get/withVideos", SERVICE_CONTROLLERS.getWithVideos);

//Get subservice by ID
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
  SERVICE_CONTROLLERS.getById
);
//Get recomendados
router.get(
  "/get/recommended",
  validateParams(
    [
      {
        param_key: "subservice",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  SERVICE_CONTROLLERS.getRecommendedSubservice
);

//para subir galeria de fotos y videos
router.post(
  "/assets/:id",
  validateParams(
    [{ param_key: "id", required: true, type: "string" }],
    "params"
  ),
  upload.fields([
    { name: "imgUrl", maxCount: 1 },
    { name: "videoUrl", maxCount: 1 },
    { name: "galleryImages", maxCount: 8 },
    { name: "galleryVideos", maxCount: 3 },
  ]),
  SERVICE_CONTROLLERS.uploadAssets
);

//--------------SETTINGS---------------------

//obtener todos los subservicios por servicio
router.get(
  "/byService/:id",
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
  SERVICE_CONTROLLERS.getByService
);
//obtener todos los subservicios agrupados por servicios
router.get("/all/byService", SERVICE_CONTROLLERS.getAllByService);

//actualizar isActive en un sub-servicio:
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

//actualizar data de productos de servivicios
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

//actualizar data de productos de servivicios
router.put(
  "/productData/:id",
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
        param_key: "categories",
        required: true,
        type: "array",
      },
      {
        param_key: "eventData",
        required: true,
        type: "object",
      },
    ],
    "body"
  ),
  SERVICE_CONTROLLERS.updateProductData
);

export default router;
