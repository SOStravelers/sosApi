import Router from "express";
const router = Router();
import validateParams from "../../middleware/validate.js";
import * as FAVORITE_CONTROLLERS from "./controllers.js";
import { isAuth } from "../../middleware/auth.js";
//añadir a favorito
router.get(
  "/add/:id",
  isAuth,
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
  FAVORITE_CONTROLLERS.addFavorite
);
//eliminar Favorito
router.get(
  "/remove/:id",
  isAuth,
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
  FAVORITE_CONTROLLERS.removeFavorite
);
//obtener todos mis favoritos
router.get("/getAll", isAuth, FAVORITE_CONTROLLERS.getFavorites);

//saber si un subservicio es favorito
router.get(
  "/isFavorite/:id",
  isAuth,
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
  FAVORITE_CONTROLLERS.isFavorite
);

export default router;
