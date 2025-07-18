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
router.get("/get/recommended", SERVICE_CONTROLLERS.getRecommendedSubservice);

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

export default router;
