import * as BOOKING_DAO from "./dao.js";

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
