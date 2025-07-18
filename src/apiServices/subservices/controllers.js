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

export const getProductCategoriesAndProducts = async (req, res, next) => {
  try {
    const subserviceId = req.query.id;
    const date = req.query.date;
    const response = await SUBSERVICE_DAO.getProductCategoriesAndProducts(
      subserviceId,
      date
    );
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

export const uploadAssets = async (req, res, next) => {
  try {
    const id = req.params.id;
    const files = req.files || {};
    const body = req.body;

    const response = await SUBSERVICE_DAO.uploadAssets(id, files, body);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
