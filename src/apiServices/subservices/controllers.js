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
    console.log("la query", req.query);
    const id = req.query.subservice;
    const response = await SUBSERVICE_DAO.getRecommendedSubservice(id);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

//------------------------SETTINGS----------------------------

//Obtienes todos los servicios con subservicios anidados

export const create = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await SUBSERVICE_DAO.create(data);
    res.status(200).json(response);
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

export const getByService = async (req, res, next) => {
  try {
    const id = req.params.id;
    const response = await SUBSERVICE_DAO.getByService(id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

//Obtienes todos los servicios con subservicios anidados
export const getAllByService = async (req, res, next) => {
  try {
    const response = await SUBSERVICE_DAO.getAllByService();
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const data = req.body;
    const id = req.params.id;

    const response = await SUBSERVICE_DAO.changeStatus(data, id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const updateOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = req.body;
    delete body._id;
    const response = await SUBSERVICE_DAO.updateOne(id, body);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const updateProductData = async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = req.body;
    delete body._id;
    const response = await SUBSERVICE_DAO.updateProductData(id, body);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
