import * as PARTNER_DAO from "./dao.js";

export const setIdClient = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await PARTNER_DAO.setIdClient(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getClientStats = async (req, res, next) => {
  const data = req.body;
  try {
    const response = await PARTNER_DAO.getClientStats(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
