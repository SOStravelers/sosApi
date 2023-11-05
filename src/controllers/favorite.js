import User from "../models/user.js";
import Favorite from "../models/favorite.js";
import { createError } from "../config/error.js";

//Añadir usuario a favorito
export const addFavorite = async (req, res, next) => {
  try {
    console.log("add favorite");
    let receptor = await User.findById(req.params.id);
    let favorite = await Favorite.findOne({
      emisor: req.user._id.toString(),
      receptor: req.params.id,
    });
    if (!receptor) {
      let err = createError(404, "User not found or invalid credentials");
      next(err);
      res.status(404).json(err);
    } else if (favorite) {
      let err = createError(409, "Already exists");
      next(err);
      res.status(404).json(err);
    } else {
      let newFavorite = new Favorite({
        emisor: req.user._id.toString(),
        receptor: req.params.id,
      });
      await newFavorite.save();
      res.send(newFavorite);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
//Eliminar usuario a favorito
export const deleteFavorite = async (req, res, next) => {
  try {
    console.log("delete favorite");
    let receptor = await User.findById(req.params.id);
    let favorite = await Favorite.findOne({
      emisor: req.user._id.toString(),
      receptor: req.params.id,
    });
    if (!receptor) {
      let err = createError(404, "User not found or invalid credentials");
      next(err);
      res.status(404).json(err);
    } else if (!favorite) {
      let err = createError(404, "relation doesnt exist");
      next(err);
      res.status(404).json(err);
    } else {
      await Favorite.findOneAndDelete({
        emisor: req.user._id.toString(),
        receptor: req.params.id,
      });
      res.send({ message: "deleted success" });
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFavorites = async (req, res, next) => {
  try {
    let favorites = await Favorite.find({
      emisor: req.user._id.toString(),
    }).populate({
      path: "receptor",
      select: "_id img personalData workerData email", // Lista de campos que deseas seleccionar
    });
    res.send(favorites);
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
