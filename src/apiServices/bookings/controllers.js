import * as BOOKING_DAO from "./dao.js";
import { decodeTokenSimple } from "../../middleware/auth.js";

export const createBooking = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await BOOKING_DAO.createBooking(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getByToken = async (req, res, next) => {
  try {
    const token = req.query.token;
    const decodedData = decodeTokenSimple(token);
    const data = decodedData.id;
    const response = await BOOKING_DAO.getByToken(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
