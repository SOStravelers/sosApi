import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";

import {
  createPassword,
  findByEmail,
  sendValidationCode,
  verifyValidationCode,
} from "../controllers/auth.js";

//Envia codigo de validacion
router.get(
  "/sendCode/:id",
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
  sendValidationCode
);
// Verificación de codigo para validar email
router.post(
  "/verifycode/:id",
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
        param_key: "code",
        required: true,
        type: "number",
      },
    ],
    "body"
  ),
  verifyValidationCode
);
//crear contraseña para usuarios que no tienen creada
router.post(
  "/createpass/:id",
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
  createPassword
);
//buscar si existe algun correo
router.post(
  "/findemail",
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
  findByEmail
);
export default router;
