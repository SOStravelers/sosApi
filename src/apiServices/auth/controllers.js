import * as AUTH_DAO from "./dao.js";

export const registerEmail = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await AUTH_DAO.registerEmail(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const loginEmail = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await AUTH_DAO.loginEmail(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const loginGoogle = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await AUTH_DAO.loginGoogle(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await AUTH_DAO.createUser(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const createPassword = async (req, res, next) => {
  const data = req.body;
  const user = req.user;
  try {
    const response = await AUTH_DAO.createPassword(data, user);
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
  id = req.params.id;
  try {
    const response = await AUTH_DAO.getById(id);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await AUTH_DAO.verifyEmail(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const findByEmail = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await AUTH_DAO.findByEmail(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const sendValidationCode = async (req, res, next) => {
  const data = req.query;
  try {
    const response = await AUTH_DAO.sendValidationCode(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const verifyValidationCode = async (req, res, next) => {
  const data = req.body;
  const id = req.params.id;
  try {
    const response = await AUTH_DAO.verifyValidationCode(data, id);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const createPassToken = async (req, res, next) => {
  const data = req.body;
  const user = req.user;
  try {
    const response = await AUTH_DAO.createPassToken(data, user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

///para testing

export const getTokenUser = async (req, res, next) => {
  const email = req.params.email;
  try {
    const response = await AUTH_DAO.verifyValidationCode(email);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
