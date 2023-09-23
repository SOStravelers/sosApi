import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import filesConfig from "../config/files.js";
import multer from "multer";

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
import {
  create,
  registerEmail,
  loginEmail,
  getById,
  getUsers,
  updateOne,
  activateMany,
  getUsersByService,
  deleteById,
  profilePhoto,
  galleryPhoto,
  findByName,
} from "../controllers/user.js";

router.post(
  "/",
  validateParams(
    [
      {
        param_key: "email",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  create
);

router.post(
  "/register",
  validateParams(
    [
      {
        param_key: "name",
        required: true,
        type: "string",
      },
      {
        param_key: "email",
        required: true,
        type: "string",
      },
      {
        param_key: "password",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  registerEmail
);
router.post(
  "/loginEmail",
  validateParams(
    [
      {
        param_key: "email",
        required: true,
        type: "string",
      },
      {
        param_key: "password",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  loginEmail
);

router.get(
  "/all",
  // validateParams(
  //   [
  //     {
  //       param_key: "body",
  //       required: true,
  //       type: "object",
  //     },
  //   ],
  //   "query"
  // ),
  getUsers
);

router.get(
  "/findService/:bodyParams",
  validateParams(
    [
      {
        param_key: "bodyParams",
        required: true,
        type: "string",
      },
    ],
    "query"
  ),
  getUsersByService
);

router.get(
  "/findbyname",
  validateParams(
    [
      {
        param_key: "name",
        required: true,
        type: "string",
      },
      {
        param_key: "type",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  findByName
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
