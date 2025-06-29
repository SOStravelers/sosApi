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
  updateDataUser,
  activateMany,
  deleteById,
  profilePhoto,
  galleryPhoto,
  getBusinesByService,
  findbusinessbyname,
  changePassword,
  hasPassword,
  setWorker,
  readyToWork,
  updateGallery,
  contacts,
  updateOneBusiness,
  getWokersByBusiness,
  findUserToken,
  findWorkerMainFlow,
  getServicesBusiness,
  getServicesWorker,
  getById,
} from "../controllers/user.js";
import { createPassToken } from "../controllers/auth.js";

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

//get business by service id
router.get(
  "/service/:id/business",
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
  getBusinesByService
);

//get wokers by business id
router.get(
  "/business/:id/workers",
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
  getWokersByBusiness
);

//get user con token
router.get("/findUserToken", findUserToken);

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
//crear contraseña
router.post(
  "/createPassToken",
  validateParams(
    [
      {
        param_key: "password",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  createPassToken
);
//Actualizar un usuario por id
router.put(
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

//Actualizar un usuario por id
router.put(
  "/data/user",

  updateDataUser
);

//Actualizar un usuario por id Business
router.put(
  "/business/:id",
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
  updateOneBusiness
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
  "/readyToWork",
  validateParams(
    [
      {
        param_key: "isActive",
        required: false,
        type: "boolean",
      },
      {
        param_key: "isAboutmeOk",
        required: false,
        type: "boolean",
      },
      {
        param_key: "isMyServicesOk",
        required: false,
        type: "boolean",
      },
      {
        param_key: "isMySchedulesOk",
        required: false,
        type: "boolean",
      },
      {
        param_key: "isMyWorkplacesOk",
        required: false,
        type: "boolean",
      },
    ],
    "body"
  ),
  readyToWork
);
//Para obtener todos los servicios del worker
router.get("/worker/services", getServicesWorker);
//Para obtener todos los servicios del business
router.get("/business/services", getServicesBusiness);

//Para obtener todos los workers
router.get("/allworkers", findWorkerMainFlow);

router.get(
  "/user/:id",
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

export default router;
