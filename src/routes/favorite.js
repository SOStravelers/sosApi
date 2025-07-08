import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import { isAuth } from "../middleware/auth.js";
import * as FavoriteController from "../controllers/favorite.js";

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
  FavoriteController.addFavorite
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
  FavoriteController.removeFavorite
);
//obtener todos mis favoritos
router.get("/getAll", isAuth, FavoriteController.getFavorites);

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
  FavoriteController.isFavorite
);

export default router;
