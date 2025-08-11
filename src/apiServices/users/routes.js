import Router from "express";
const router = Router();
import validateParams from "../../middleware/validate.js";
import filesConfig from "../../config/files.js";
import multer from "multer";
const limits = {
  fileSize: filesConfig.profile.maxsize,
};

import { isAuth } from "../../middleware/auth.js";

const upload = multer({
  limits: { fieldSize: 50 * 1024 * 1024 },
});

import * as USER_CONTROLLERS from "./controllers.js";

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
  isAuth,
  USER_CONTROLLERS.getById
);

//get user con token
router.get("/findUserToken", isAuth, USER_CONTROLLERS.findUserToken);

//verficar si tiene contraseña
router.get("/haspass", isAuth, USER_CONTROLLERS.hasPassword);

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
  isAuth,
  USER_CONTROLLERS.changePassword
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
  isAuth,
  USER_CONTROLLERS.updateOne
);

//Actualizar un usuario por id
router.put("/data/user", isAuth, USER_CONTROLLERS.updateDataUser);

//Actualizar un usuario por id
router.put("/info/user", isAuth, USER_CONTROLLERS.updateInfoUser);

export default router;
