import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import { addOrUpdate, getByUser } from "../controllers/holliday.js";

//Crear/Actualizar schedule worker/business
router.post(
  "/add",
  validateParams(
    [
      {
        param_key: "range",
        required: true,
        type: "array",
      },
    ],
    "body"
  ),
  addOrUpdate
);
//get by user
router.get("/get", getByUser);

export default router;
