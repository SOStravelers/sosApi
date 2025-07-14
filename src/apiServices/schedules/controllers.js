import * as SCHEDULE_DAO from "./dao.js";

export const businessSchedule = async (req, res, next) => {
  const data = req.query;
  try {
    const response = await SCHEDULE_DAO.businessSchedule(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
