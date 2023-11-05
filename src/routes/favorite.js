import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import {
  addFavorite,
  deleteFavorite,
  getFavorites,
} from "../controllers/favorite.js";

//añadir a favorito
router.get(
  "/add/:id",
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
  addFavorite
);
//eliminar Favorito
router.get(
  "/delete/:id",
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
  deleteFavorite
);
//obtener todos mis favoritos
router.get("/getAll", getFavorites);

export default router;
