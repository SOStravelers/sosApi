import User from "../models/user.js";
import Favorite from "../models/favorite.js";
import { createError } from "../config/error.js";

//Añadir usuario a favorito
export const addFavorite = async (req, res, next) => {
  global.logger.info("--- ADD FAVORITE ---");
  try {
    let receptor = await User.findById(req.params.id);
    let favorite = await Favorite.findOne({
      emisor: req.user._id.toString(),
      receptor: req.params.id,
    });
    if (!receptor) {
      throw createError(404, "User not found or invalid credentials");
    } else if (favorite) {
      throw createError(409, "Already exists");
    } else {
      let newFavorite = new Favorite({
        emisor: req.user._id.toString(),
        receptor: req.params.id,
      });
      await newFavorite.save();
      res.status(201).json(newFavorite);
    }
  } catch (err) {
    next(err);
  }
};
//Eliminar usuario a favorito
export const deleteFavorite = async (req, res, next) => {
  global.logger.info("--- DELETE FAVORITE ---");
  try {
    let receptor = await User.findById(req.params.id);
    let favorite = await Favorite.findOne({
      emisor: req.user._id.toString(),
      receptor: req.params.id,
    });
    if (!receptor) {
      throw createError(404, "User not found or invalid credentials");
    } else if (!favorite) {
      throw createError(404, "relation doesnt exist");
    } else {
      await Favorite.findOneAndDelete({
        emisor: req.user._id.toString(),
        receptor: req.params.id,
      });
      res.status(200).json({ message: "deleted success" });
    }
  } catch (err) {
    next(err);
  }
};
//Obtener todos los favoritos de un usuario
export const getFavorites = async (req, res, next) => {
  global.logger.info("--- GET FAVORITE ---");
  try {
    let favorites = await Favorite.find({
      emisor: req.user._id.toString(),
    }).populate({
      path: "receptor",
      select: "_id img personalData workerData email", // Lista de campos que deseas seleccionar
    });
    res.status(200).json(favorites);
  } catch (err) {
    next(err);
  }
};
