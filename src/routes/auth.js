import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";

import {
  createUser,
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
  workerByTimeAndService,
  businessByService,
  getBussinesId,
  getWorkerId,
  loginEmailBusinnes,
  loginEmailBusiness,
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
  createUser
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
router.post(
  "/loginEmailBusiness",
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
  loginEmailBusiness
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
// //Obtener un usuario business por id
router.get(
  "/user/business/:id",
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
  getBussinesId
);
// //Obtener un usuario business por id
router.get(
  "/user/worker/:id",
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
  getWorkerId
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

router.post(
  "/workerByTimeAndService",
  validateParams(
    [
      {
        param_key: "startTime",
        required: true,
        type: "string",
      },
      {
        param_key: "day",
        required: true,
        type: "number",
      },
      {
        param_key: "subservice",
        required: true,
        type: "string",
      },
      {
        param_key: "page",
        required: false,
        type: "number",
      },
      {
        param_key: "page",
        required: false,
        type: "number",
      },
    ],
    "body"
  ),
  workerByTimeAndService
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
//get business by service
router.get(
  "/business",
  validateParams(
    [
      {
        param_key: "service",
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
        required: true,
        type: "string",
      },
    ],
    "query"
  ),
  businessByService
);
export default router;
