import * as SUBSERVICE_DAO from "./dao.js";

export const getWithVideos = async (req, res, next) => {
  try {
    const response = await SUBSERVICE_DAO.getWithVideos();
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getAll = async (req, res, next) => {
  const data = req.query;
  try {
    const response = await SUBSERVICE_DAO.getAll(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const response = await SUBSERVICE_DAO.getById(id);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getRecommendedSubservice = async (req, res, next) => {
  try {
    const response = await SUBSERVICE_DAO.getRecommendedSubservice();
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
