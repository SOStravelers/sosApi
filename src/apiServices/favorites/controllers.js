import * as FAVORITE_DAO from "./dao.js";

export const addFavorite = async (req, res, next) => {
  try {
    const user = req.user;
    const subserviceId = req.params.id;
    const response = await FAVORITE_DAO.addFavorite(subserviceId, user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const user = req.user;
    const subserviceId = req.params.id;
    const response = await FAVORITE_DAO.removeFavorite(subserviceId, user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getFavorites = async (req, res, next) => {
  try {
    const user = req.user;
    const response = await FAVORITE_DAO.getFavorites(user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const isFavorite = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = req.user;
    const response = await FAVORITE_DAO.isFavorite(id, user);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
