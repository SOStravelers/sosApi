import Router from "express";
const router = Router();
import validateParams from "../../middleware/validate.js";
import { isAuth } from "../../middleware/auth.js";
import * as AUTH_CONTROLLERS from "./controllers.js";

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
  AUTH_CONTROLLERS.registerEmail
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
  AUTH_CONTROLLERS.loginEmail
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
  AUTH_CONTROLLERS.loginGoogle
);
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
  AUTH_CONTROLLERS.createUser
);

//crear contraseña para usuarios que no tienen creada
router.post(
  "/createpass/",
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
  isAuth,
  AUTH_CONTROLLERS.createPassword
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
  AUTH_CONTROLLERS.getById
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
  AUTH_CONTROLLERS.verifyEmail
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
  AUTH_CONTROLLERS.findByEmail
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
      {
        param_key: "newEmail",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  AUTH_CONTROLLERS.sendValidationCode
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
      {
        param_key: "email",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  AUTH_CONTROLLERS.verifyValidationCode
);

export default router;
