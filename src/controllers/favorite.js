import User from "../models/user.js";
import Subservice from "../models/subservice.js";
import Favorite from "../models/favorite.js";
import { createError } from "../config/error.js";

//Añadir usuario a favorito
export const addFavorite = async (req, res, next) => {
  global.logger.info("--- ADD FAVORITE ---");
  try {
    let subservice = await Subservice.findById(req.params.id);
    if (!subservice) throw createError(404, "Subservice not found ");
    let favorite = await Favorite.findOne({
      user: req.user._id,
      subservice: req.params.id,
    });
    if (favorite && !favorite.isActive) {
      await Favorite.findOneAndUpdate(
        { _id: favorite._id },
        { isActive: true }
      );
      res.status(201).json("saved");
    } else {
      let newFavorite = new Favorite({
        user: req.user._id,
        subservice: req.params.id,
        isActive: true,
      });
      await newFavorite.save();
      res.status(201).json("saved");
    }
  } catch (err) {
    next(err);
  }
};
//Eliminar usuario a favorito
export const removeFavorite = async (req, res, next) => {
  global.logger.info("--- REMOVE FAVORITE ---");
  try {
    let subservice = await Subservice.findById(req.params.id);
    if (!subservice) throw createError(404, "Subservice not found ");
    let favorite = await Favorite.findOne({
      user: req.user._id,
      subservice: req.params.id,
    });
    console.log(favorite);
    if (favorite && favorite.isActive) {
      await Favorite.findOneAndUpdate(
        { _id: favorite._id },
        { isActive: false }
      );
    }
    res.status(200).json("removed");
  } catch (err) {
    next(err);
  }
};
//Obtener todos los favoritos de un usuario
export const getFavorites = async (req, res, next) => {
  global.logger.info("--- GET FAVORITE (via aggregate) ---");
  try {
    const favorites = await Favorite.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $lookup: {
          from: "subservices",
          localField: "subservice",
          foreignField: "_id",
          as: "subservice",
        },
      },
      { $unwind: "$subservice" },
      {
        $match: {
          "subservice.isActive": true,
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "subservice.service",
          foreignField: "_id",
          as: "subservice.service",
        },
      },
      { $unwind: "$subservice.service" },
      {
        $match: {
          "subservice.service.isActive": true,
        },
      },
      {
        $project: {
          user: 1,
          subservice: {
            _id: 1,
            name: 1,
            rate: 1,
            rateCount: 1,
            commentsCount: 1,
            coverImg: 1,
            gallery: 1,
            videoUrl: 1,
            isActive: 1,
            duration: 1,
            tourData: 1,
            typeService: 1,
            service: {
              _id: 1,
              name: 1,
              isActive: 1,
            },
          },
        },
      },
    ]);

    res.status(200).json(favorites);
  } catch (err) {
    next(err);
  }
};
//te dice si un subservicio por usuario es favorito
export const isFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const favorite = await Favorite.findOne({
      user: req.user._id,
      subservice: id,
    });
    if (favorite.isActive) {
      return res.status(200).json({ isFavorite: true });
    } else {
      return res.status(200).json({ isFavorite: false });
    }
  } catch (err) {
    next(err);
  }
};
