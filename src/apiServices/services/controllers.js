import * as SERVICE_DAO from "./dao.js";

export const create = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await SERVICE_DAO.create(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getServices = async (req, res, next) => {
  const data = req.query;
  try {
    const response = await SERVICE_DAO.getServices(data);
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
    const response = await SERVICE_DAO.getById(id);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const updateOne = async (req, res, next) => {
  const data = req.body;
  const id = req.params.id;
  try {
    const response = await SERVICE_DAO.updateOne(data, id);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const changeStatus = async (req, res, next) => {
  const data = req.body;
  const id = req.params.id;
  try {
    const response = await SERVICE_DAO.changeStatus(data, id);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const activateMany = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await SERVICE_DAO.activateMany(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const uploadIconService = async (req, res, next) => {
  const data = req.query;
  const file = req.file;
  try {
    const response = await SERVICE_DAO.uploadIconService(data, file);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
export const serviceAndSubservice = async (req, res, next) => {
  try {
    const response = await SERVICE_DAO.serviceAndSubservice();
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
