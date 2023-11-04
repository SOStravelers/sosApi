import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";

import {
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
  "/verifyCode/:id",
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
export default router;
