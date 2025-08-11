import Router from "express";
const router = Router();
import multer from "multer";
import validateParams from "../middleware/validate.js";
import { isAuth } from "../middleware/auth.js";
import {
  create,
  getById,
  updateOne,
  activateMany,
  getByService,
  getAll,
  getPrice,
  infoSubserviceByWorker,
  getByEmail,
  getWithVideos,
  getRecommendedSubservice,
  uploadAssets,
  getAllByService,
  changeStatus,
} from "../controllers/subservice.js";
import { isValidImage, isValidVideo } from "../config/uploadTypes.js";
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
  uploadAssets
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

//update subservice
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
//Obtener los services y subservices  por email
router.get(
  "/all/byemail/:email",
  validateParams(
    [
      {
        param_key: "email",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  getByEmail
);

export default router;
