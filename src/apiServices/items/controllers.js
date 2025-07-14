import * as ITEM_DAO from "./dao.js";

export const createItem = async (req, res, next) => {
  try {
    const subserviceId = req.params.id;
    const response = await ITEM_DAO.createItem(subserviceId);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const createItemsAndProducts = async (req, res, next) => {
  try {
    const subserviceId = req.params.id;
    const data = req.body;
    const response = await ITEM_DAO.createItemsAndProducts(data, subserviceId);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getAllItemBySubservice = async (req, res, next) => {
  try {
    const subserviceId = req.params.id;
    const date = req.query.date;
    const response = await ITEM_DAO.getAllItemBySubservice(subserviceId, date);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const updateAllItem = async (req, res, next) => {
  try {
    const id = req.params.id;
    const response = await ITEM_DAO.updateAllItem(id);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
