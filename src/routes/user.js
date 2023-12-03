import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import filesConfig from "../config/files.js";
import multer from "multer";
import { createError } from "../config/error.js";
const limits = {
  fileSize: filesConfig.profile.maxsize,
};

const upload = multer({
  limits: { fieldSize: 50 * 1024 * 1024 },
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
  contacts,
  getServices,
} from "../controllers/user.js";

//get users by type and isActive
router.get(
  "/all",
  validateParams(
    [
      {
        param_key: "type",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  getUsers
);
//get users by type and isActive
router.get("/contacts", contacts);
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
// router.post("/profile/photo", upload.single("file"), profilePhoto);

router.post(
  "/profile/photo",
  upload.single("file"),
  async function (req, res, next) {
    try {
      let formats = ["jpeg", "jpg", "png", "svg"];
      const base64Data = req.body.file; // tu cadena base64 aquí

      // Encuentra la parte de la cadena que contiene el tipo de imagen (jpeg, png, etc.)
      const match = base64Data.match(/^data:image\/([a-zA-Z]+);base64,/);

      // Verifica si hubo una coincidencia y extrae el tipo de imagen
      const imageType = match ? match[1] : null;

      if (!formats.includes(imageType)) {
        let err = createError(400, "Format img not valid");
        next(err);
      } else {
        await profilePhoto(req, res, next);
      }
    } catch (err) {
      next(err);
    }
  },
  // Middleware de manejo de errores específicos de Multer
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: "File max 50mb" });
    }
    next(err); // Pasar otros errores al siguiente middleware de manejo de errores
  }
);

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
  async function (req, res, next) {
    try {
      let formats = ["jpeg", "jpg", "png", "svg"];
      const base64Data = req.body.file; // tu cadena base64 aquí

      // Encuentra la parte de la cadena que contiene el tipo de imagen (jpeg, png, etc.)
      const match = base64Data.match(/^data:image\/([a-zA-Z]+);base64,/);

      // Verifica si hubo una coincidencia y extrae el tipo de imagen
      const imageType = match ? match[1] : null;

      if (!formats.includes(imageType)) {
        let err = createError(400, "Format img not valid");
        next(err);
      } else {
        await galleryPhoto(req, res, next);
      }
    } catch (err) {
      next(err);
    }
  },
  // Middleware de manejo de errores específicos de Multer
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: "File max 50mb" });
    }
    next(err); // Pasar otros errores al siguiente middleware de manejo de errores
  }
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
router.get("/getServices", getServices);

export default router;
