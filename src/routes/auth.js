import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";

import {
  create,
  getById,
  registerEmail,
  loginEmail,
  loginGoogle,
  createPassword,
  findByEmail,
  sendValidationCode,
  verifyValidationCode,
  getUsers,
  verifyEmail,
} from "../controllers/auth.js";

//Create user/worker/business
router.post(
  "/",
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
      {
        param_key: "name",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  create
);
//register user
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
//login user by email
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
//login user by email
router.post(
  "/verifyEmail",
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
  verifyEmail
);
//login user by google
router.post(
  "/loginGoogle",
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
        param_key: "image",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  loginGoogle
);
// //Obtener un usuario por id
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
//Envia codigo de validacion
router.get(
  "/sendCode/template",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
      {
        param_key: "email",
        required: true,
        type: "string",
      },
    ],
    "query"
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
export default router;
