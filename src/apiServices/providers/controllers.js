import * as PROVIDERS_DAO from "./dao.js";

export const createProvider = async (req, res, next) => {
  try {
    console.log("pasa");
    const files = req.files || {};
    const data = req.body;
    const response = await PROVIDERS_DAO.createProvider(data, files);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const updateDataProvider = async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = req.body;
    delete body._id;
    const response = await PROVIDERS_DAO.updateDataProvider(id, body);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getProviderById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const response = await PROVIDERS_DAO.getProviderById(id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const updateImgProvider = async (req, res, next) => {
  try {
    const id = req.params.id;
    const files = req.files || {};
    const response = await PROVIDERS_DAO.updateImgProvider(id, files);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const activeProvider = async (req, res, next) => {
  try {
    const id = req.params.id;
    const state = req.body.isActive;
    const response = await PROVIDERS_DAO.activeProvider(id, state);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
