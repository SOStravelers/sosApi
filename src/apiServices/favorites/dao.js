import Favorite from "./model.js";
import User from "../users/model.js";
import Subservice from "../subservices/model.js";
import { createError } from "../../config/error.js";

//Añadir usuario a favorito
export const addFavorite = async (id, user) => {
  logger.info("*** ADD FAVORITE DAO ***");
  try {
    let subservice = await Subservice.findById(id);
    if (!subservice) throw createError(404, "Subservice not found ");
    let favorite = await Favorite.findOne({
      user: user._id,
      subservice: id,
    });
    if (favorite) {
      await Favorite.findOneAndUpdate(
        { _id: favorite._id },
        { isActive: true }
      );
      return "saved";
    } else {
      let newFavorite = new Favorite({
        user: user._id,
        subservice: id,
        isActive: true,
      });
      await newFavorite.save();
      return "saved";
    }
  } catch (err) {
    throw err;
  }
};
//Eliminar usuario a favorito
export const removeFavorite = async (id, user) => {
  logger.info("*** REMOVE FAVORITE DAO ***");
  try {
    let subservice = await Subservice.findById(id);
    if (!subservice) throw createError(404, "Subservice not found ");
    let favorite = await Favorite.findOne({
      user: user._id,
      subservice: id,
    });
    if (favorite && favorite.isActive) {
      await Favorite.findOneAndUpdate(
        { _id: favorite._id },
        { isActive: false }
      );
    }
    return "removed";
  } catch (err) {
    throw err;
  }
};
//Obtener todos los favoritos de un usuario
export const getFavorites = async (user) => {
  logger.info("*** GET FAVORITE DAO (via aggregate) ***");
  try {
    const favorites = await Favorite.aggregate([
      {
        $match: {
          user: user._id,
          isActive: true,
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
        $addFields: {
          "subservice.isFavorite": true,
        },
      },
      {
        $sort: {
          updatedAt: -1, // 👈 orden descendente por última actualización
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
            imgUrl: 1,
            isActive: 1,
            duration: 1,
            tourData: 1,
            typeService: 1,
            isFavorite: 1,
            service: {
              _id: 1,
              name: 1,
              isActive: 1,
            },
          },
        },
      },
    ]);
    return favorites;
  } catch (err) {
    throw err;
  }
};

//te dice si un subservicio por usuario es favorito
export const isFavorite = async (id, user) => {
  try {
    const favorite = await Favorite.findOne({
      user: user._id,
      subservice: id,
    });
    if (favorite.isActive) {
      return { isFavorite: true };
    } else {
      return { isFavorite: false };
    }
  } catch (err) {
    throw err;
  }
};
