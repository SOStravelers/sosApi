import * as USER_DAO from "./dao.js";

export const getById = async (req, res, next) => {
  const id = req.params._id;
  try {
    const response = await USER_DAO.getById(id);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const findUserToken = async (req, res, next) => {
  const user = req.user;
  try {
    const response = await USER_DAO.findUserToken(user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const hasPassword = async (req, res, next) => {
  const user = req.user;
  try {
    const response = await USER_DAO.hasPassword(user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  const data = req.body;
  const user = req.user;
  try {
    const response = await USER_DAO.changePassword(data, user);
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
  const userId = req.params.id;
  try {
    const response = await USER_DAO.updateOne(data, userId);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const updateDataUser = async (req, res, next) => {
  const data = req.body;
  const user = req.user;
  try {
    const response = await USER_DAO.updateDataUser(data, user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const updateInfoUser = async (req, res, next) => {
  const data = req.body;
  const user = req.user;
  try {
    const response = await USER_DAO.updateInfoUser(data, user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
