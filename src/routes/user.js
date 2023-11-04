import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import filesConfig from "../config/files.js";
import multer from "multer";

const limits = {
  fileSize: filesConfig.profile.maxsize,
};
const fileFilter = (req, file, cb) => {
  console.log("filters");
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
import {
  getUsers,
  updateOne,
  activateMany,
  deleteById,
  profilePhoto,
  galleryPhoto,
  getBusinesByService,
  findbusinessbyname,
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
router.post("/profile/photo", upload.single("file"), profilePhoto);
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
export default router;
