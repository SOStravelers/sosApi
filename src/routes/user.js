import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import filesConfig from "../config/files.js";
import multer from "multer";
import { createError } from "../config/error.js";
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
  limits: { fieldSize: 100 * 1024 * 1024 },
  fileFilter,
});
import {
  getUsers,
  updateOne,
  activateMany,
  deleteById,
  profilePhoto,
  galleryPhoto,
  getBusinesByService,
  findbusinessbyname,
  changePassword,
  hasPassword,
  setWorker,
  inactiveMode,
  updateGallery,
} from "../controllers/user.js";

//get users by type and isActive
router.get(
  "/all",
  validateParams(
    [
      {
        param_key: "type",
        required: true,
        type: "string",
      },
    ],
    "query"
  ),
  getUsers
);
//set worker
router.get(
  "/setworker",

  setWorker
);
//get business accounts by service with paginate
router.get(
  "/businessbyservice",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
      {
        param_key: "page",
        required: true,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  getBusinesByService
);
//get business acounts by name with paginate
router.get(
  "/findbusinessbyname",
  validateParams(
    [
      {
        param_key: "name",
        required: true,
        type: "string",
      },
      {
        param_key: "page",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
      {
        param_key: "service",
        required: true,
        type: "string",
      },
    ],
    "query"
  ),
  findbusinessbyname
);

//verficar si tiene contraseña
router.get("/haspass", hasPassword);
//cambiar contraseña
router.post(
  "/changepass",
  validateParams(
    [
      {
        param_key: "currentPassword",
        required: true,
        type: "string",
      },
      {
        param_key: "newPassword",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  changePassword
);
//Actualizar un usuario por id
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
  validateParams(
    [
      {
        param_key: "name",
        required: false,
        type: "object",
      },
    ],
    "body"
  ),
  updateOne
);
//Activar varios usuarios
router.put(
  "/active/many",
  validateParams(
    [
      {
        param_key: "users",
        required: true,
        type: "array",
      },
    ],
    "body"
  ),
  activateMany
);
//Eliminar un usuario por id
router.delete(
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
  deleteById
);
// SUBIR ARCHIVOS FOTO DE PERFIL
router.post("/profile/photo", upload.single("file"), async (req, res, next) => {
  try {
    // Resto del código para procesar la imagen
    const result = await profilePhoto(req, res, next);

    // Resto del código si es necesario
  } catch (error) {
    // Manejar el error
    if (error instanceof multer.MulterError) {
      // Si es un error de Multer, devolver el error correspondiente
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File size exceeds the limit." });
      } else {
        return res.status(400).json({ error: "Illegal file format." });
      }
    } else {
      // Si no es un error de Multer, devolver el error original
      next(error);
    }
  }
});
// SUBIR ARCHIVOS FOTOS DE GALERIA
router.post(
  "/profile/gallery/:number",

  validateParams(
    [
      {
        param_key: "number",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  upload.single("file"),
  galleryPhoto
);
router.put(
  "/profile/updategallery",
  validateParams(
    [
      {
        param_key: "array",
        required: true,
        type: "array",
      },
    ],
    "body"
  ),
  updateGallery
);
router.post(
  "/inactivemode",
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
  inactiveMode
);

export default router;
