import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import { create } from "../controllers/currency.js";

router.post(
  "/create",
  validateParams(
    [
      {
        param_key: "code",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  create
);

export default router;
